import {
  callNotifyUserAfterApproved,
  callUpdateResumeStatus,
} from "@/config/api";
import { IResume } from "@/types/backend";
import {
  DownloadOutlined,
  FilePdfOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Select,
  Space,
  message,
  notification,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const { Option } = Select;

interface IProps {
  onClose: (v: boolean) => void;
  open: boolean;
  dataInit: IResume | null | any;
  setDataInit: (v: any) => void;
  reloadTable: () => void;
}
const ViewDetailResume = (props: IProps) => {
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const { onClose, open, dataInit, setDataInit, reloadTable } = props;
  const [form] = Form.useForm();
  const navigate = useNavigate(); // <<< KHỞI TẠO NAVIGATE

  const handleChangeStatus = async () => {
    setIsSubmit(true);

    const status = form.getFieldValue("status");

    if (status === dataInit?.status) {
      setIsSubmit(false);
      return;
    }
    const res = await callUpdateResumeStatus(dataInit?.id, status);
    if (res.data) {
      if (status === "APPROVED") {
        try {
          await callNotifyUserAfterApproved(dataInit?.id);
          message.success("Đã gửi thông báo trúng tuyển đến ứng viên!");
        } catch (error) {
          notification.error({
            message: "Lỗi gửi tin nhắn",
            description:
              "Không thể gửi tin nhắn tự động. Vui lòng thử lại sau.",
          });
        }
      }
      message.success("Update Resume status thành công!");
      setDataInit(null);
      onClose(false);
      reloadTable();
    } else {
      notification.error({
        message: "Có lỗi xảy ra",
        description: res.message,
      });
    }

    setIsSubmit(false);
  };

  const handleSendMessage = () => {
    if (!dataInit?.user) {
      notification.error({
        message: "Lỗi",
        description: "Không có thông tin ứng viên để nhắn tin.",
      });
      return;
    }
    // Điều hướng đến trang chat và truyền thông tin người nhận qua state
    navigate("/chat/detail", { state: { receiver: dataInit.user } });
  };

  useEffect(() => {
    if (dataInit) {
      form.setFieldValue("status", dataInit.status);
    }
    return () => form.resetFields();
  }, [dataInit]);

  return (
    <>
      <Drawer
        title="Thông Tin Resume"
        placement="right"
        onClose={() => {
          onClose(false);
          setDataInit(null);
        }}
        open={open}
        width={"40vw"}
        maskClosable={false}
        destroyOnHidden
        extra={
          <>
            <Space>
              <Button icon={<MessageOutlined />} onClick={handleSendMessage}>
                Nhắn tin
              </Button>
              <Button
                loading={isSubmit}
                type="primary"
                onClick={handleChangeStatus}
                disabled={dataInit?.status === "APPROVED"}
              >
                Change Status
              </Button>
            </Space>
          </>
        }
      >
        <Descriptions title="" bordered column={2} layout="vertical">
          <Descriptions.Item label="Email">{dataInit?.email}</Descriptions.Item>
          <Descriptions.Item label="CV">
            <Space size="large">
              <Button
                type="link"
                icon={<FilePdfOutlined />}
                href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${dataInit?.url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Xem chi tiết
              </Button>

              <Button
                type="link"
                icon={<DownloadOutlined />}
                href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/files?fileName=${dataInit?.url}&folder=resume`}
              >
                Tải xuống
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Form form={form}>
              <Form.Item name={"status"}>
                <Select
                  // placeholder="Select a option and change input text above"
                  // onChange={onGenderChange}
                  // allowClear
                  style={{ width: "100%" }}
                  defaultValue={dataInit?.status}
                >
                  <Option value="PENDING">PENDING</Option>
                  <Option value="REVIEWING">REVIEWING</Option>
                  <Option value="APPROVED">APPROVED</Option>
                  <Option value="REJECTED">REJECTED</Option>
                </Select>
              </Form.Item>
            </Form>
          </Descriptions.Item>
          <Descriptions.Item label="Tên Job">
            {dataInit?.job?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Tên Công Ty">
            {dataInit?.companyName}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dataInit && dataInit.createdAt
              ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
              : ""}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày sửa">
            {dataInit && dataInit.updatedAt
              ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
              : ""}
          </Descriptions.Item>
          <Descriptions.Item label="Cover Letter">
            {dataInit?.coverLetter || "Không có cover letter"}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </>
  );
};

export default ViewDetailResume;
