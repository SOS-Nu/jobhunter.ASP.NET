import {
  callExportPaymentMonthly,
  callExportPaymentYearly,
} from "@/config/api";
import { DownloadOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, message, Modal, Tabs } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

interface IProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const ModalExportPayment = ({ open, setOpen }: IProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("month");

  const handleDownload = (blob: any, fileName: string) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (activeTab === "month") {
        const date = values.monthYear; // dayjs object
        const month = date.month() + 1;
        const year = date.year();
        const res = await callExportPaymentMonthly(month, year);
        if (res) handleDownload(res, `Bao_Cao_Thang_${month}_${year}.docx`);
      } else {
        const date = values.year;
        const year = date.year();
        const res = await callExportPaymentYearly(year);
        if (res) handleDownload(res, `Bao_Cao_Nam_${year}.docx`);
      }
      message.success("Xuất báo cáo thành công!");
      setOpen(false);
    } catch (error) {
      message.error("Có lỗi khi xuất báo cáo");
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Xuất Báo Cáo Doanh Thu (Word)"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      destroyOnClose
    >
      <Tabs
        defaultActiveKey="month"
        onChange={setActiveTab}
        items={[
          { label: "Báo cáo Tháng", key: "month" },
          { label: "Báo cáo Năm", key: "year" },
        ]}
      />

      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        {activeTab === "month" ? (
          <Form.Item
            name="monthYear"
            label="Chọn Tháng/Năm"
            rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
            initialValue={dayjs()}
          >
            <DatePicker
              picker="month"
              format="MM/YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="year"
            label="Chọn Năm"
            rules={[{ required: true, message: "Vui lòng chọn năm" }]}
            initialValue={dayjs()}
          >
            <DatePicker picker="year" format="YYYY" style={{ width: "100%" }} />
          </Form.Item>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<DownloadOutlined />}
          >
            Tải Xuống
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalExportPayment;
