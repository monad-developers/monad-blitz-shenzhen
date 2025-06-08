"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NursingHomeFormProps {
  onSuccess?: () => void;
}

export const NursingHomeForm = ({ onSuccess }: NursingHomeFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    familyContact: "",
    healthCondition: "",
    monthlyFee: "",
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "NursingHome",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await writeContractAsync({
        functionName: "admitResident",
        args: [
          formData.name,
          BigInt(formData.age),
          formData.familyContact as `0x${string}`,
          BigInt(parseFloat(formData.monthlyFee) * 10 ** 18),
          formData.healthCondition,
        ],
      });

      notification.success("居民信息已成功提交！");
      setFormData({
        name: "",
        age: "",
        familyContact: "",
        healthCondition: "",
        monthlyFee: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("提交失败:", error);
      notification.error("提交失败: " + (error.message || error.toString()));
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border border-gray-200">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">居民档案管理系统</h3>
        <p className="text-gray-600 text-sm">Senior Care Institute - 专业护理档案创建</p>
        <div className="w-24 h-1 bg-gradient-to-r from-gray-400 to-gray-600 mx-auto mt-3 rounded-full"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            居民姓名
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="请输入姓名"
              required
            />
          </div>
          <p className="text-xs text-gray-500">居民的全名</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            年龄
          </label>
          <div className="relative">
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="请输入年龄"
              required
            />
          </div>
          <p className="text-xs text-gray-500">居民的实际年龄</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            家属联系地址
          </label>
          <div className="relative">
            <input
              type="text"
              name="familyContact"
              value={formData.familyContact}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="0x..."
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500">钱包地址用于身份验证和联系</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            月费标准（ETH）
          </label>
          <div className="relative">
            <input
              type="text"
              name="monthlyFee"
              value={formData.monthlyFee}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="0.1"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-sm text-gray-500">ETH</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">每月护理费用标准</p>
        </div>
      </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            健康状况评估
          </label>
          <textarea
            name="healthCondition"
            value={formData.healthCondition}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
            placeholder="请详细描述居民的健康状况、特殊需求、用药情况等..."
            required
          />
          <p className="text-xs text-gray-500">详细的健康信息有助于提供更好的护理服务</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className={`w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-4 px-6 rounded-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] ${isMining ? "opacity-50 cursor-not-allowed" : ""
              }`}
            disabled={isMining}
          >
            <div className="flex items-center justify-center space-x-3">
              {isMining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>创建居民档案</span>
                </>
              )}
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};