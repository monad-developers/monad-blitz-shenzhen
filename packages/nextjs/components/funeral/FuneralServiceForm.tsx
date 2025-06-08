"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface FuneralServiceFormProps {
  onSuccess?: () => void;
}

export const FuneralServiceForm = ({ onSuccess }: FuneralServiceFormProps) => {
  const [orderId, setOrderId] = useState("");
  const [serviceType, setServiceType] = useState("0"); // 0: BASIC, 1: STANDARD, 2: PREMIUM
  const [serviceDate, setServiceDate] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);

  // 获取殡葬订单信息
  const { data: orderData, isLoading: isLoadingOrder } = useScaffoldReadContract({
    contractName: "FuneralService",
    functionName: "getFuneralOrder",
    args: [orderId ? BigInt(orderId) : undefined],
    enabled: !!orderId,
  });

  // 获取服务价格
  const { data: servicePrice, isLoading: isLoadingPrice } = useScaffoldReadContract({
    contractName: "FuneralService",
    functionName: "servicePrices",
    args: [BigInt(serviceType)],
    enabled: true,
  });

  // 确认殡葬服务函数
  const { writeContractAsync, isLoading: isProcessingService } = useScaffoldWriteContract({
    contractName: "FuneralService",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 将日期转换为时间戳
      const serviceDateTimestamp = Math.floor(new Date(serviceDate).getTime() / 1000);
      
      // 确认殡葬服务
      const tx = await writeContractAsync({
        functionName: "confirmService",
        args: [
          BigInt(orderId),
          BigInt(serviceType),
          BigInt(serviceDateTimestamp),
          specialRequests
        ],
        value: servicePrice,
      });

      notification.success("殡葬服务已确认！");
      setOrderId("");
      setServiceType("0");
      setServiceDate("");
      setSpecialRequests("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("确认服务失败:", error);
      notification.error("确认服务失败: " + (error.message || error.toString()));
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
      <h3 className="text-xl font-bold text-gray-800 mb-4">殡葬服务确认</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            required
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
                <p className="text-sm">总费用: {Number(orderData.totalCost) / 10**18} ETH</p>
                <p className="text-sm">已支付: {orderData.isPaid ? "是" : "否"}</p>
              </>
            )}
          </div>
        )}

        {orderData && Number(orderData.status) === 0 && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">服务类型</span>
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="select select-bordered w-full"
                required
              >
                <option value="0">基础服务</option>
                <option value="1">标准服务</option>
                <option value="2">高级服务</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">服务日期</span>
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">特殊要求</span>
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="textarea textarea-bordered w-full"
                placeholder="请输入特殊要求或留空"
              />
            </div>

            {servicePrice && (
              <div className="alert alert-info">
                <span>服务费用: {Number(servicePrice) / 10**18} ETH</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading || isProcessingService ? "loading" : ""}`}
              disabled={loading || isProcessingService || !orderData || Number(orderData.status) !== 0}
            >
              {loading || isProcessingService ? "处理中..." : "确认服务"}
            </button>
          </>
        )}

        {orderData && Number(orderData.status) > 0 && (
          <div className="alert alert-warning">
            <span>此订单已确认，无法再次修改</span>
          </div>
        )}
      </form>
    </div>
  );
};