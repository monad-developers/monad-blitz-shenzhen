"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface PatientDeceasedFormProps {
  onSuccess?: () => void;
}

export const PatientDeceasedForm = ({ onSuccess }: PatientDeceasedFormProps) => {
  const [patientId, setPatientId] = useState("");
  const [familyContact, setFamilyContact] = useState("");
  const [loading, setLoading] = useState(false);

  // 获取患者信息
  const { data: patientData, isLoading: isLoadingPatient } = useScaffoldReadContract({
    contractName: "HospitalCore",
    functionName: "getPatient",
    args: [patientId ? BigInt(patientId) : undefined],
    enabled: !!patientId,
  });

  // 更新患者状态为死亡
  const { writeContractAsync, isLoading: isProcessing } = useScaffoldWriteContract({
    contractName: "HospitalCore",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tx = await writeContractAsync({
        functionName: "updatePatientStatus",
        args: [BigInt(patientId), BigInt(5), familyContact], // 5 表示死亡状态
      });

      notification.success("患者状态已更新为死亡，并已通知殡葬服务");
      setPatientId("");
      setFamilyContact("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("更新患者状态失败:", error);
      notification.error("更新患者状态失败: " + (error.message || error.toString()));
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
      <h3 className="text-xl font-bold text-gray-800 mb-4">患者死亡处理</h3>
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

        {patientData && Number(patientData.status) === 5 && (
          <div className="alert alert-warning">
            <span>此患者已被标记为死亡状态</span>
          </div>
        )}

        {patientData && Number(patientData.status) !== 5 && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">家属联系人</span>
              </label>
              <input
                type="text"
                value={familyContact}
                onChange={(e) => setFamilyContact(e.target.value)}
                className="input input-bordered w-full"
                placeholder="输入家属联系人姓名"
                required
              />
            </div>

            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>确认此操作将标记患者为死亡状态，并自动通知殡葬服务</span>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading || isProcessing ? "loading" : ""}`}
              disabled={loading || isProcessing || !patientData || Number(patientData.status) === 5}
            >
              {loading || isProcessing ? "处理中..." : "确认患者死亡并通知殡葬服务"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};