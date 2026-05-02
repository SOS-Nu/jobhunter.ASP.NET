import { callCreateResume, callUploadSingleFile } from "@/config/api";
import { useAppSelector } from "@/redux/hooks";
import { IJob } from "@/types/backend";
import { UploadOutlined } from "@ant-design/icons";
import {
  ProForm,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import type { UploadProps } from "antd";
import {
  Button,
  Col,
  ConfigProvider,
  Divider,
  Modal,
  Row,
  Upload,
  message,
  notification,
} from "antd";
import enUS from "antd/lib/locale/en_US";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  jobDetail: IJob | null;
}

const ApplyModal = (props: IProps) => {
  const { isModalOpen, setIsModalOpen, jobDetail } = props;
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated,
  );
  const user = useAppSelector((state) => state.account.user);
  const [urlCV, setUrlCV] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleOkButton = async () => {
    setIsLoading(true);

    if (!urlCV && isAuthenticated) {
      message.error("Vui lòng upload CV!");
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setIsModalOpen(false);
      setIsLoading(false);
      const callbackUrl = window.location.pathname + window.location.search;
      navigate(`/login?callback=${encodeURIComponent(callbackUrl)}`);
    } else {
      if (jobDetail) {
        const res = await callCreateResume(
          urlCV,
          jobDetail?.id,
          user?.email!,
          user?.id!,
          coverLetter, // Truyền thêm nội dung giới thiệu
        );

        if (res.data) {
          // Check res.data thay vì message để đảm bảo logic
          message.success("Rải CV thành công!");
          setIsModalOpen(false);
          setCoverLetter(""); // Reset form sau khi thành công
          setUrlCV("");
        } else {
          notification.error({
            message: "Có lỗi xảy ra",
            description: res.message,
          });
        }
        setIsLoading(false);
      }
    }
  };
  const propsUpload: UploadProps = {
    maxCount: 1,
    multiple: false,
    accept: "application/pdf,application/msword, .doc, .docx, .pdf",
    async customRequest({ file, onSuccess, onError }: any) {
      const res = await callUploadSingleFile(file, "resume");
      if (res && res.data) {
        setUrlCV(res.data.fileName);
        if (onSuccess) onSuccess("ok");
      } else {
        if (onError) {
          setUrlCV("");
          const error = new Error(res.message);
          onError({ event: error });
        }
      }
    },
    onChange(info) {
      if (info.file.status !== "uploading") {
        // console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(
          info?.file?.error?.event?.message ??
            "Đã có lỗi xảy ra khi upload file.",
        );
      }
    },
  };

  return (
    <>
      <Modal
        title="Ứng Tuyển Job"
        open={isModalOpen}
        onOk={() => handleOkButton()}
        onCancel={() => {
          setIsModalOpen(false);
          setCoverLetter(""); // Reset khi đóng modal
        }}
        maskClosable={false}
        okText={isAuthenticated ? "Rải CV Nào" : "Đăng Nhập Nhanh"}
        cancelButtonProps={{ style: { display: "none" } }}
        destroyOnClose={true} // Đổi thành destroyOnClose để clear form hoàn toàn
        confirmLoading={isLoading}
      >
        <Divider />
        {isAuthenticated ? (
          <div>
            <ConfigProvider locale={enUS}>
              <ProForm submitter={{ render: () => <></> }}>
                <Row gutter={[10, 5]}>
                  <Col span={24}>
                    <div>
                      Bạn đang ứng tuyển công việc <b>{jobDetail?.name}</b> tại{" "}
                      <b>{jobDetail?.company?.name}</b>
                    </div>
                  </Col>

                  <Col span={24} style={{ marginTop: 15 }}>
                    <ProFormText
                      label="Email"
                      name="email"
                      disabled
                      initialValue={user?.email}
                    />
                  </Col>

                  <Col span={24}>
                    <ProForm.Item
                      label={"Upload file CV"}
                      rules={[
                        { required: true, message: "Vui lòng upload file!" },
                      ]}
                    >
                      <Upload {...propsUpload}>
                        <Button icon={<UploadOutlined />}>
                          Tải lên CV của bạn ( Hỗ trợ *.doc, *.docx, *.pdf, and
                          &lt; 5MB )
                        </Button>
                      </Upload>
                    </ProForm.Item>
                  </Col>

                  {/* Phần thêm mới: Giới thiệu bản thân */}
                  <Col span={24}>
                    <ProFormTextArea
                      label="Giới thiệu bản thân (Cover Letter)"
                      placeholder="Một chút lời chào và lý do bạn phù hợp với vị trí này sẽ giúp bạn ghi điểm hơn với nhà tuyển dụng..."
                      fieldProps={{
                        value: coverLetter,
                        onChange: (e) => setCoverLetter(e.target.value),
                        rows: 4,
                        showCount: true,
                        maxLength: 500,
                      }}
                    />
                  </Col>
                </Row>
              </ProForm>
            </ConfigProvider>
          </div>
        ) : (
          <div style={{ padding: "10px 0" }}>
            Bạn chưa đăng nhập hệ thống. Vui lòng đăng nhập để có thể "Rải CV"
            bạn nhé!
          </div>
        )}
        <Divider />
      </Modal>
    </>
  );
};
export default ApplyModal;
