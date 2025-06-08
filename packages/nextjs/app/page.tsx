"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { BuildingOffice2Icon, HeartIcon, UserGroupIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton, FaucetButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
// 移除hardhat导入，使用更通用的方式检查网络
// import { hardhat } from "viem/chains";
import { NursingHomeForm } from "~~/components/nursing/NursingHomeForm";
import { HospitalTransferForm } from "~~/components/hospital/HospitalTransferForm";
import { HospitalPaymentForm } from "~~/components/hospital/HospitalPaymentForm";
import { PatientDeceasedForm } from "~~/components/hospital/PatientDeceasedForm";
import { FuneralServiceForm } from "~~/components/funeral/FuneralServiceForm";
import { FuneralServiceManagement } from "~~/components/funeral/FuneralServiceManagement";

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
  const [activeSubTab, setActiveSubTab] = useState("create"); // 添加子标签状态
  const { targetNetwork } = useTargetNetwork();
  // 修改为检查是否为测试网，而不是特定的hardhat网络
  const isTestNetwork = targetNetwork.testnet === true;

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const IconComponent = activeTabData.icon;

  // 根据当前标签渲染相应的功能组件
  const renderTabContent = () => {
    switch (activeTab) {
      case "nursing":
        return (
          <div className="space-y-6">
            <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveSubTab("create")}
                className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 ${activeSubTab === "create"
                  ? "bg-white text-gray-800 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                创建档案
              </button>
              <button
                onClick={() => setActiveSubTab("transfer")}
                className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 ${activeSubTab === "transfer"
                  ? "bg-white text-gray-800 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                转院服务
              </button>
            </div>
            {activeSubTab === "create" ? <NursingHomeForm /> : <HospitalTransferForm />}
          </div>
        );
      case "hospital":
        return (
          <div className="space-y-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveSubTab("payment")}
                className={`px-4 py-2 rounded-lg ${activeSubTab === "payment" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                治疗付费
              </button>
              <button
                onClick={() => setActiveSubTab("deceased")}
                className={`px-4 py-2 rounded-lg ${activeSubTab === "deceased" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                死亡处理
              </button>
            </div>
            {activeSubTab === "payment" ? <HospitalPaymentForm /> : <PatientDeceasedForm />}
          </div>
        );
      case "funeral":
        return (
          <div className="space-y-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveSubTab("confirm")}
                className={`px-4 py-2 rounded-lg ${activeSubTab === "confirm" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                确认服务
              </button>
              <button
                onClick={() => setActiveSubTab("manage")}
                className={`px-4 py-2 rounded-lg ${activeSubTab === "manage" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                服务管理
              </button>
            </div>
            {activeSubTab === "confirm" ? <FuneralServiceForm /> : <FuneralServiceManagement />}
          </div>
        );
      case "cemetery":
        return (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-center text-gray-600">墓地服务功能正在开发中...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Wallet Connection Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <RainbowKitCustomConnectButton />
        {isTestNetwork && <FaucetButton />}
      </div>

      {/* Hero Section */}
      <div className="relative pt-12 pb-8 bg-gradient-to-b from-gray-400 to-gray-500">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-light italic text-white mb-3 leading-tight tracking-wide">
            ZangAi
          </h1>
          <p className="text-xl md:text-2xl font-light italic text-white mb-2 leading-relaxed tracking-wide">
            We help families tell their story.
          </p>
          <p className="text-lg md:text-xl font-light italic text-gray-100 leading-relaxed tracking-wide">
            Welcome to ZangAi.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-t-xl">
          <nav className="flex space-x-0" aria-label="Tabs">
            {tabs.map((tab, index) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveSubTab("create"); // 重置子标签
                  }}
                  className={`group relative flex-1 inline-flex items-center justify-center py-4 px-6 font-medium text-sm transition-all duration-300 ${isActive
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    } ${index === 0 ? "rounded-tl-xl" : ""
                    } ${index === tabs.length - 1 ? "rounded-tr-xl" : ""
                    }`}
                >
                  <TabIcon
                    className={`mr-2 h-5 w-5 transition-all duration-300 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                      }`}
                  />
                  <span className="font-semibold">{tab.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-600"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-6xl mx-auto px-6 pb-6 w-full overflow-auto">
        <div className="bg-white rounded-b-xl shadow-xl border-l border-r border-b border-gray-200 min-h-full">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg mr-4">
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{activeTabData.name}管理系统</h2>
                <p className="text-gray-600">{activeTabData.description}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {renderTabContent()}
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
