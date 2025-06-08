"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface HospitalPaymentFormProps {
  onSuccess?: () => void;
}

export const HospitalPaymentForm = ({ onSuccess }: HospitalPaymentFormProps) => {
  const [patientId, setPatientId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // 获取患者信息
  const { data: patientData, isLoading: isLoadingPatient } = useScaffoldReadContract({
    contractName: "HospitalCore",
    functionName: "getPatient",
    args: [patientId ? BigInt(patientId) : undefined],
    enabled: !!patientId,
  });

  // 医院付费函数
  const { writeContractAsync, isLoading: isProcessingPayment } = useScaffoldWriteContract({
    contractName: "HospitalCore",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 将ETH金额转换为Wei
      const paymentInWei = parseEther(paymentAmount);

      const tx = await writeContractAsync({
        functionName: "payForTreatment",
        args: [BigInt(patientId)],
        value: paymentInWei,
      });

      notification.success("付款成功！");
      setPatientId("");
      setPaymentAmount("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("付款失败:", error);
      notification.error("付款失败: " + (error.message || error.toString()));
    } finally {
      setLoading(false);
    }
  };

  // 获取患者状态文本
  const getPatientStatusText = (statusCode: number) => {
    const statuses = ["未入院", "入院中", "治疗中", "康复中", "出院", "死亡"];
    return statuses[statusCode] || "未知状态";
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">医院治疗付费</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">患者ID</span>
          </label>
          <input
            type="number"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="input input-bordered w-full"
            placeholder="输入患者ID"
            required
          />
        </div>

        {patientId && isLoadingPatient && (
          <div className="text-center py-2">
            <span className="loading loading-spinner loading-md"></span>
            <p className="text-sm text-gray-500">加载患者信息...</p>
          </div>
        )}

        {patientId && patientData && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800">患者信息</h4>
            <p className="text-sm">姓名: {patientData.name}</p>
            <p className="text-sm">年龄: {Number(patientData.age)}</p>
            <p className="text-sm">状态: {getPatientStatusText(Number(patientData.status))}</p>
            <p className="text-sm">入院日期: {new Date(Number(patientData.admissionDate) * 1000).toLocaleDateString()}</p>
            <p className="text-sm">治疗费用: {patientData.treatmentCost ? Number(patientData.treatmentCost) / 10**18 : 0} ETH</p>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">付款金额 (ETH)</span>
          </label>
          <input
            type="text"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="input input-bordered w-full"
            placeholder="0.1"
            required
          />
        </div>

        <button
          type="submit"
          className={`btn btn-primary w-full ${loading || isProcessingPayment ? "loading" : ""}`}
          disabled={loading || isProcessingPayment || !patientData}
        >
          {loading || isProcessingPayment ? "处理中..." : "确认付款"}
        </button>
      </form>
    </div>
  );
};