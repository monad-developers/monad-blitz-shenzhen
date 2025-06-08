"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface HospitalTransferFormProps {
  onSuccess?: () => void;
}

export const HospitalTransferForm = ({ onSuccess }: HospitalTransferFormProps) => {
  const [residentId, setResidentId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // 获取居民信息
  const { data: residentData, isLoading: isLoadingResident } = useScaffoldReadContract({
    contractName: "NursingHome",
    functionName: "residents",
    args: [residentId ? BigInt(residentId) : undefined],
    enabled: !!residentId,
  });

  // 转院到医院的写入函数
  const { writeContractAsync, isLoading: isTransferring } = useScaffoldWriteContract({
    contractName: "NursingHome",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tx = await writeContractAsync({
        functionName: "transferToHospital",
        args: [BigInt(residentId), reason],
      });

      notification.success("已成功将居民转入医院！");
      setResidentId("");
      setReason("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("转院失败:", error);
      notification.error("转院失败: " + (error.message || error.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">病危老人转入医院</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">居民ID</span>
          </label>
          <input
            type="number"
            value={residentId}
            onChange={(e) => setResidentId(e.target.value)}
            className="input input-bordered w-full"
            placeholder="输入居民ID"
            required
          />
        </div>

        {residentId && isLoadingResident && (
          <div className="text-center py-2">
            <span className="loading loading-spinner loading-md"></span>
            <p className="text-sm text-gray-500">加载居民信息...</p>
          </div>
        )}

        {residentId && residentData && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800">居民信息</h4>
            <p className="text-sm">姓名: {residentData[0]}</p>
            <p className="text-sm">年龄: {Number(residentData[1])}</p>
            <p className="text-sm">健康状况: {residentData[6]}</p>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">转院原因</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="textarea textarea-bordered w-full"
            placeholder="请详细描述转院原因"
            required
          />
        </div>

        <button
          type="submit"
          className={`btn btn-primary w-full ${loading || isTransferring ? "loading" : ""}`}
          disabled={loading || isTransferring || !residentData}
        >
          {loading || isTransferring ? "处理中..." : "确认转院"}
        </button>
      </form>
    </div>
  );
};