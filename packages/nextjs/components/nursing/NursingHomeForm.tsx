"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NursingHomeFormProps {
  onSuccess?: () => void;
}

export const NursingHomeForm = ({ onSuccess }: NursingHomeFormProps) => {
  const [formData, setFormData] = useState({
    familyContact: "",
    healthCondition: "",
    monthlyFee: "",
  });

  const { writeContractAsync, isLoading } = useScaffoldWriteContract({
    contractName: "NursingHome",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tx = await writeContractAsync({
        functionName: "admitResident",
        args: [
          "", // 空字符串代替姓名
          0, // 0代替年龄
          formData.familyContact as `0x${string}`,
          formData.healthCondition,
          BigInt(parseFloat(formData.monthlyFee) * 10**18),
        ],
      });

      notification.success("居民信息已成功提交！");
      setFormData({
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
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">创建养老院居民档案</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">家属联系地址（钱包地址）</span>
          </label>
          <input
            type="text"
            name="familyContact"
            value={formData.familyContact}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="0x..."
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">健康状况</span>
          </label>
          <textarea
            name="healthCondition"
            value={formData.healthCondition}
            onChange={handleChange}
            className="textarea textarea-bordered w-full"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">月费（ETH）</span>
          </label>
          <input
            type="text"
            name="monthlyFee"
            value={formData.monthlyFee}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="0.1"
            required
          />
        </div>

        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "提交中..." : "提交信息"}
        </button>
      </form>
    </div>
  );
};