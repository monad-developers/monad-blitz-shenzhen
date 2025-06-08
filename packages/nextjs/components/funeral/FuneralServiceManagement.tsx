"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface FuneralServiceManagementProps {
  onSuccess?: () => void;
}

export const FuneralServiceManagement = ({ onSuccess }: FuneralServiceManagementProps) => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  // 获取殡葬订单信息
  const { data: orderData, isLoading: isLoadingOrder, refetch: refetchOrder } = useScaffoldReadContract({
    contractName: "FuneralService",
    functionName: "getFuneralOrder",
    args: [orderId ? BigInt(orderId) : undefined],
    enabled: !!orderId,
  });

  // 开始殡葬服务函数
  const { writeContractAsync: startServiceAsync, isLoading: isStartingService } = useScaffoldWriteContract({
    contractName: "FuneralService",
    functionName: "startService",
  });

  // 完成殡葬服务函数
  const { writeContractAsync: completeServiceAsync, isLoading: isCompletingService } = useScaffoldWriteContract({
    contractName: "FuneralService",
    functionName: "completeService",
  });

  const handleStartService = async () => {
    if (!orderId) return;
    setLoading(true);

    try {
      const tx = await startServiceAsync({
        args: [BigInt(orderId)],
      });

      notification.success("殡葬服务已开始！");
      await refetchOrder();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("开始服务失败:", error);
      notification.error("开始服务失败: " + (error.message || error.toString()));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteService = async () => {
    if (!orderId) return;
    setLoading(true);

    try {
      const tx = await completeServiceAsync({
        args: [BigInt(orderId)],
      });

      notification.success("殡葬服务已完成！");
      await refetchOrder();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("完成服务失败:", error);
      notification.error("完成服务失败: " + (error.message || error.toString()));
    } finally {
      setLoading(false);
    }
  };

  // 获取服务状态文本
  const getServiceStatusText = (statusCode: number) => {
    const statuses = ["已发起", "已确认", "进行中", "已完成"];
    return statuses[statusCode] || "未知状态";
  };

  // 获取服务类型文本
  const getServiceTypeText = (typeCode: number) => {
    const types = ["基础服务", "标准服务", "高级服务"];
    return types[typeCode] || "未知类型";
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">殡葬服务管理</h3>
      <div className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">订单ID</span>
          </label>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="input input-bordered w-full"
            placeholder="输入订单ID"
          />
        </div>

        {orderId && isLoadingOrder && (
          <div className="text-center py-2">
            <span className="loading loading-spinner loading-md"></span>
            <p className="text-sm text-gray-500">加载订单信息...</p>
          </div>
        )}

        {orderId && orderData && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800">订单信息</h4>
            <p className="text-sm">逝者姓名: {orderData.deceasedName}</p>
            <p className="text-sm">患者ID: {Number(orderData.patientId)}</p>
            <p className="text-sm">家属联系人: {orderData.familyContact}</p>
            <p className="text-sm">状态: {getServiceStatusText(Number(orderData.status))}</p>
            {Number(orderData.status) > 0 && (
              <>
                <p className="text-sm">服务类型: {getServiceTypeText(Number(orderData.serviceType))}</p>
                <p className="text-sm">服务日期: {new Date(Number(orderData.serviceDate) * 1000).toLocaleDateString()}</p>
                <p className="text-sm">特殊要求: {orderData.specialRequests || "无"}</p>
                <p className="text-sm">总费用: {Number(orderData.totalCost) / 10**18} ETH</p>
                <p className="text-sm">已支付: {orderData.isPaid ? "是" : "否"}</p>
              </>
            )}
          </div>
        )}

        {orderData && Number(orderData.status) === 1 && (
          <button
            onClick={handleStartService}
            className={`btn btn-primary w-full ${loading || isStartingService ? "loading" : ""}`}
            disabled={loading || isStartingService}
          >
            {loading || isStartingService ? "处理中..." : "开始服务"}
          </button>
        )}

        {orderData && Number(orderData.status) === 2 && (
          <button
            onClick={handleCompleteService}
            className={`btn btn-primary w-full ${loading || isCompletingService ? "loading" : ""}`}
            disabled={loading || isCompletingService}
          >
            {loading || isCompletingService ? "处理中..." : "完成服务"}
          </button>
        )}

        {orderData && Number(orderData.status) === 3 && (
          <div className="alert alert-success">
            <span>此订单服务已完成</span>
          </div>
        )}

        {orderData && Number(orderData.status) === 0 && (
          <div className="alert alert-warning">
            <span>此订单尚未确认服务，请先确认服务</span>
          </div>
        )}
      </div>
    </div>
  );
};