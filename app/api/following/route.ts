import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// 确保 .env.local 文件中有 NEYNAR_API_KEY
if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set in .env.local");
}

// 遵循 v2 SDK 的语法，使用 Configuration 对象初始化客户端
const client = new NeynarAPIClient(new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
}));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fidParam = searchParams.get('fid');

  if (!fidParam) {
    return NextResponse.json({ message: "fid is required" }, { status: 400 });
  }

  const fid = parseInt(fidParam);

  try {
    let cursor: string | null = null;
    let allFollowing: any[] = [];
    
    // 使用 Neynar SDK 和分页循环来获取所有关注的人
    do {
      const response = await client.fetchUserFollowing({ fid, limit: 100, cursor: cursor ?? undefined });
      allFollowing = allFollowing.concat(response.users);
      cursor = response.next.cursor;
    } while (cursor);

    // 将关注者信息存入 Supabase
    const userUpserts: {
      fid: number;
      username: string;
      display_name: string;
      pfp_url: string;
    }[] = [];
    const walletUpserts: {
      user_fid: number;
      address: string;
      chain: string;
    }[] = [];

    for (const item of allFollowing) {
      const user = item.user;
      if (!user) continue;

      userUpserts.push({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
      });

      if (user.verified_addresses?.eth_addresses) {
        user.verified_addresses.eth_addresses.forEach((address: string) => {
          if (address) {
            walletUpserts.push({
              user_fid: user.fid,
              address: address.toLowerCase(),
              chain: "ethereum",
            });
          }
        });
      }
      if (user.verified_addresses?.sol_addresses) {
        user.verified_addresses.sol_addresses.forEach((address: string) => {
          if (address) {
            walletUpserts.push({
              user_fid: user.fid,
              address: address.toLowerCase(),
              chain: "solana",
            });
          }
        });
      }
    }
    
    if (userUpserts.length > 0) {
      const { error: userError } = await supabase
        .from("users")
        .upsert(userUpserts, { onConflict: "fid" });
      if (userError) {
        console.error("Error upserting users:", userError);
        // 根据需要，您可以选择在这里返回错误
      }
    }

    if (walletUpserts.length > 0) {
      const { error: walletError } = await supabase
        .from("wallets")
        .upsert(walletUpserts, { onConflict: "address" });
      if (walletError) {
        console.error("Error upserting wallets:", walletError);
        // 根据需要，您可以选择在这里返回错误
      }
    }

    // 关键改动：Neynar API 返回的数组中，每个对象都包含一个 user 属性。
    // 我们需要从 item.user 中提取真正的用户信息。
    const followingProfiles = allFollowing.map(item => {
      const user = item.user; // 提取嵌套的 user 对象
      return {
        fid: user?.fid,
        pfp_url: user?.pfp_url,
        display_name: user?.display_name,
        bio: user?.profile?.bio?.text ?? '', // 安全地访问 bio
        username: user?.username,
      }
    });

    return NextResponse.json(followingProfiles);

  } catch (error) {
    console.error("Failed to fetch from Neynar:", error);
    const errorMessage = (error as any).response?.data?.message || 'Failed to fetch from Neynar';
    const errorStatus = (error as any).response?.status || 500;
    return NextResponse.json({ message: errorMessage, error: error }, { status: errorStatus });
  }
}

