"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { BuildingOffice2Icon, HeartIcon, UserGroupIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton, FaucetButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { hardhat } from "viem/chains";

interface TabData {
  id: string;
  name: string;
  icon: any;
  description: string;
  services: string[];
}

const tabs: TabData[] = [
  {
    id: "nursing",
    name: "养老院",
    icon: BuildingOffice2Icon,
    description: "为老人提供专业的护理和舒适的居住环境",
    services: ["24小时护理服务", "医疗保健", "营养餐饮", "康复理疗", "文娱活动"]
  },
  {
    id: "hospital",
    name: "医院",
    icon: HeartIcon,
    description: "专业的医疗团队，为生命最后阶段提供关怀",
    services: ["临终关怀", "疼痛管理", "心理支持", "家属陪护", "医疗设备支持"]
  },
  {
    id: "funeral",
    name: "送葬服务",
    icon: UserGroupIcon,
    description: "庄重而温馨的告别仪式，让爱延续",
    services: ["仪式策划", "遗体处理", "追思服务", "花圈布置", "音响设备"]
  },
  {
    id: "cemetery",
    name: "墓地服务",
    icon: ArchiveBoxIcon,
    description: "安息之地的选择，永恒的纪念",
    services: ["墓地选购", "墓碑设计", "安葬仪式", "后续维护", "纪念服务"]
  }
];

const Home: NextPage = () => {
  const [activeTab, setActiveTab] = useState("nursing");
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const IconComponent = activeTabData.icon;

  return (
    <div className="h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 flex flex-col">
      {/* Wallet Connection Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>

      {/* Hero Section */}
      <div className="relative pt-6 pb-4">
        <div className="absolute inset-0 bg-gray-200 opacity-30"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 leading-tight">
            ZangAi
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-1 leading-relaxed">
            We help families tell their story.
          </p>
          <p className="text-base text-gray-500 leading-relaxed">
            Welcome to ZangAi.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="border-b border-gray-300">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                    ? "border-gray-600 text-gray-800"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400"
                    }`}
                >
                  <TabIcon
                    className={`-ml-0.5 mr-1.5 h-4 w-4 transition-colors duration-200 ${activeTab === tab.id ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600"
                      }`}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-6xl mx-auto px-6 py-6 w-full">
        <div className="bg-white bg-opacity-80 rounded-xl p-5 shadow-xl border border-gray-200 h-full">
          <div className="flex items-center mb-3">
            <IconComponent className="h-7 w-7 text-gray-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{activeTabData.name}</h2>
              <p className="text-gray-600 text-sm">{activeTabData.description}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-2">服务项目</h3>
              <ul className="space-y-1.5">
                {activeTabData.services.map((service, index) => (
                  <li key={index} className="flex items-center text-gray-600 text-sm">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                    {service}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-200 bg-opacity-60 rounded-lg p-4 border border-gray-300">
              <h3 className="text-base font-semibold text-gray-700 mb-2">联系咨询</h3>
              <div className="space-y-1.5 text-gray-600 text-sm">
                <p className="flex items-center">
                  <span className="font-medium mr-2">电话:</span>
                  400-888-0000
                </p>
                <p className="flex items-center">
                  <span className="font-medium mr-2">邮箱:</span>
                  service@zangai.com
                </p>
                <p className="flex items-center">
                  <span className="font-medium mr-2">地址:</span>
                  北京市朝阳区XXX大街123号
                </p>
              </div>

              <button className="mt-3 w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
                立即咨询
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="border-t border-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="text-center">
            <p className="text-gray-600 text-xs mb-0.5">
              在生命的每个阶段，我们都陪伴在您身边
            </p>
            <p className="text-gray-500 text-xs">
              © 2024 ZangAi. 用心服务，温暖相伴。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
