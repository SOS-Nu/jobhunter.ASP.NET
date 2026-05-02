import DataTable from "@/components/client/data-table";
import Access from "@/components/share/access";
import { callExportPaymentExcel, callUpdatePaymentStatus } from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions"; // Giả sử bạn có permission cho payment
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchPayment } from "@/redux/slice/paymentSlice";
import { IPaymentHistory } from "@/types/backend";
import {
  CloudDownloadOutlined,
  EditOutlined,
  FileExcelOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  Button,
  Dropdown,
  MenuProps,
  Popconfirm,
  Space,
  Tag,
  message,
  notification,
} from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useRef, useState } from "react";
import { sfEqual, sfLike } from "spring-filter-query-builder";
import ModalExportPayment from "./modal.export";

const PaymentPage = () => {
  const tableRef = useRef<ActionType>(null);
  const [openModalExport, setOpenModalExport] = useState(false);

  const isFetching = useAppSelector((state) => state.payment.isFetching);
  const meta = useAppSelector((state) => state.payment.meta);
  const payments = useAppSelector((state) => state.payment.result);
  const dispatch = useAppDispatch();

  const reloadTable = () => {
    tableRef?.current?.reload();
  };

  // Hàm update trạng thái nhanh
  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "SUCCESS" ? "FAILED" : "SUCCESS";
    const res = await callUpdatePaymentStatus(id, newStatus);
    if (res && res.data) {
      message.success(`Đã cập nhật trạng thái thành ${newStatus}`);
      reloadTable();
    } else {
      notification.error({ message: "Lỗi cập nhật", description: res.message });
    }
  };

  // Hàm xuất Excel
  const handleExportExcel = async () => {
    try {
      // Lấy query filter hiện tại từ tableRef hoặc state (để đơn giản ta xuất all hoặc cần xử lý thêm state filter)
      // Ở đây demo xuất all
      const res = await callExportPaymentExcel("");
      if (res) {
        const url = window.URL.createObjectURL(new Blob([res as any]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Payment_Export_${dayjs().format("DDMMYYYY")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
      }
    } catch (e) {
      message.error("Có lỗi khi xuất Excel");
    }
  };

  const columns: ProColumns<IPaymentHistory>[] = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      hideInSearch: true,
    },
    {
      title: "Email User",
      dataIndex: ["userEmail"], // Truy cập nested object
      copyable: true,
    },
    {
      title: "Số tiền (VND)",
      dataIndex: "amount",
      sorter: true,
      render: (dom, entity) => {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(entity.amount);
      },
      hideInSearch: true,
    },
    {
      title: "Code ",
      dataIndex: "orderId",
      copyable: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      valueEnum: {
        SUCCESS: { text: "SUCCESS", status: "Success" },
        FAILED: { text: "FAILED", status: "Error" },
      },
      render: (_, entity) => (
        <Tag color={entity.status === "SUCCESS" ? "green" : "red"}>
          {entity.status}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 180,
      sorter: true,
      render: (_, record) =>
        dayjs(record.createdAt).format("DD/MM/YYYY HH:mm:ss"),
      hideInSearch: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 100,
      render: (_, entity) => (
        <Space>
          {/* Giả sử dùng permission UPDATE role cho payment demo */}
          <Access permission={ALL_PERMISSIONS.ROLES.UPDATE} hideChildren>
            <Popconfirm
              title="Đổi trạng thái?"
              description={`Bạn muốn đổi sang ${entity.status === "SUCCESS" ? "FAILED" : "SUCCESS"}?`}
              onConfirm={() => handleUpdateStatus(entity.id, entity.status)}
            >
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#ffa500" }} />}
              />
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  const buildQuery = (params: any, sort: any, filter: any) => {
    const clone = { ...params };
    // Logic build query với spring-filter
    let q: any = {
      page: params.current,
      size: params.pageSize,
      filter: "",
    };

    const filters = [];
    if (clone.orderId) filters.push(sfLike("orderId", clone.orderId));
    if (clone.status) filters.push(sfEqual("status", clone.status));
    // Note: Filter nested object như user.email cần backend hỗ trợ hoặc dùng query đặc biệt

    q.filter = filters.join(" and ");
    if (!q.filter) delete q.filter;

    let sortBy = "";
    if (sort?.createdAt)
      sortBy = `sort=createdAt,${sort.createdAt === "ascend" ? "asc" : "desc"}`;
    if (sort?.amount)
      sortBy = `sort=amount,${sort.amount === "ascend" ? "asc" : "desc"}`;
    if (!sortBy) sortBy = "sort=createdAt,desc";

    return `${queryString.stringify(q)}&${sortBy}`;
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Xuất Excel",
      icon: <FileExcelOutlined style={{ color: "green" }} />,
      onClick: handleExportExcel,
    },
    {
      key: "2",
      label: "Xuất Báo cáo (Word)",
      icon: <FileWordOutlined style={{ color: "blue" }} />,
      onClick: () => setOpenModalExport(true),
    },
  ];

  return (
    <div>
      {/* Sử dụng component Access nếu cần check quyền xem trang */}
      <DataTable<IPaymentHistory>
        actionRef={tableRef}
        headerTitle="Lịch sử giao dịch"
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={payments}
        request={async (params, sort, filter): Promise<any> => {
          const query = buildQuery(params, sort, filter);
          await dispatch(fetchPayment({ query }));
          // Không cần return gì cũng được vì đã ép kiểu Promise<any>
          // hoặc return null; để chắc chắn.
        }}
        scroll={{ x: true }}
        pagination={{
          current: meta.page,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
        }}
        toolBarRender={() => [
          <Dropdown key="export" menu={{ items }}>
            <Button type="primary" icon={<CloudDownloadOutlined />}>
              Export Data
            </Button>
          </Dropdown>,
        ]}
      />

      <ModalExportPayment open={openModalExport} setOpen={setOpenModalExport} />
    </div>
  );
};

export default PaymentPage;
