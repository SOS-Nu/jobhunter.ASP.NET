import {
  callCreateCompany,
  callUpdateCompany,
  callUploadSingleFile,
} from "@/config/api";
import {
  COUNTRY_LIST,
  FIELD_LIST,
  LOCATION_LIST,
  nonAccentVietnamese,
} from "@/config/utils";
import { ICompany } from "@/types/backend";
import {
  CheckSquareOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  FooterToolbar,
  ModalForm,
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import {
  AutoComplete,
  Col,
  ConfigProvider,
  Form,
  Modal,
  Row,
  Upload,
  message,
  notification,
} from "antd";
import enUS from "antd/lib/locale/en_US";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "styles/reset.scss";
import { v4 as uuidv4 } from "uuid";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  dataInit?: ICompany | null;
  setDataInit: (v: any) => void;
  reloadTable: () => void;
}

interface ICompanyForm {
  name: string;
  address: string;
  field: string;
  website: string;
  scale: string;
  country: string;
  foundingYear: number;
  location: string;
}

interface ICompanyLogo {
  name: string;
  uid: string;
}

const ModalCompany = (props: IProps) => {
  const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;

  //modal animation
  const [animation, setAnimation] = useState<string>("open");

  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
  const [dataLogo, setDataLogo] = useState<ICompanyLogo[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [locationOptions, setLocationOptions] = useState(LOCATION_LIST);
  const [fieldOptions, setFieldOptions] = useState(FIELD_LIST);
  const [countryOptions, setCountryOptions] = useState(COUNTRY_LIST);

  const [value, setValue] = useState<string>("");
  const [form] = Form.useForm();

  useEffect(() => {
    if (dataInit?.id) {
      if (dataInit.description) setValue(dataInit.description);
      // Cập nhật lại danh sách logo khi mở modal edit
      if (dataInit.logo) {
        setDataLogo([
          {
            name: dataInit.logo,
            uid: uuidv4(),
          },
        ]);
      }
    }
  }, [dataInit]);

  const handleLocationSearch = (value: string) => {
    if (!value) {
      setLocationOptions(LOCATION_LIST);
      return;
    }
    const lowerCaseValue = nonAccentVietnamese(value.toLowerCase());
    const filtered = LOCATION_LIST.filter((item) =>
      nonAccentVietnamese(item.label.toLowerCase()).includes(lowerCaseValue)
    );
    setLocationOptions(filtered);
  };

  const handleSearch = (
    value: string,
    list: { label: string; value: string }[],
    setOptions: Function
  ) => {
    if (!value) {
      setOptions(list);
      return;
    }
    const lowerCaseValue = nonAccentVietnamese(value.toLowerCase());
    const filtered = list.filter((item) =>
      nonAccentVietnamese(item.label.toLowerCase()).includes(lowerCaseValue)
    );
    setOptions(filtered);
  };

  const submitCompany = async (valuesForm: ICompanyForm) => {
    const {
      name,
      address,
      field,
      website,
      scale,
      country,
      foundingYear,
      location,
    } = valuesForm;

    if (dataLogo.length === 0 && !dataInit?.logo) {
      message.error("Vui lòng upload ảnh Logo");
      return;
    }

    const finalLogo = dataLogo.length > 0 ? dataLogo[0].name : dataInit?.logo;

    if (dataInit?.id) {
      //update
      const res = await callUpdateCompany(
        dataInit.id,
        name,
        address,
        value,
        finalLogo!,
        field,
        website,
        scale,
        country,
        foundingYear,
        location
      );
      if (res.data) {
        message.success("Cập nhật company thành công");
        handleReset();
        reloadTable();
      } else {
        notification.error({
          message: "Có lỗi xảy ra",
          description: res.message,
        });
      }
    } else {
      //create
      const res = await callCreateCompany(
        name,
        address,
        value,
        finalLogo!,
        field,
        website,
        scale,
        country,
        foundingYear,
        location
      );
      if (res.data) {
        message.success("Thêm mới company thành công");
        handleReset();
        reloadTable();
      } else {
        notification.error({
          message: "Có lỗi xảy ra",
          description: res.message,
        });
      }
    }
  };

  const handleReset = async () => {
    form.resetFields();
    setValue("");
    setDataInit(null);

    //add animation when closing modal
    setAnimation("close");
    await new Promise((r) => setTimeout(r, 400));
    setOpenModal(false);
    setAnimation("open");
  };

  const handleRemoveFile = (file: any) => {
    setDataLogo([]);
  };

  const handlePreview = async (file: any) => {
    if (!file.originFileObj) {
      setPreviewImage(file.url);
      setPreviewOpen(true);
      setPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
      return;
    }
    getBase64(file.originFileObj, (url: string) => {
      setPreviewImage(url);
      setPreviewOpen(true);
      setPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
    });
  };

  const getBase64 = (img: any, callback: any) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange = (info: any) => {
    if (info.file.status === "uploading") {
      setLoadingUpload(true);
    }
    if (info.file.status === "done") {
      setLoadingUpload(false);
    }
    if (info.file.status === "error") {
      setLoadingUpload(false);
      message.error(
        info?.file?.error?.event?.message ?? "Đã có lỗi xảy ra khi upload file."
      );
    }
  };

  const handleUploadFileLogo = async ({ file, onSuccess, onError }: any) => {
    const res = await callUploadSingleFile(file, "company");
    if (res && res.data) {
      setDataLogo([
        {
          name: res.data.fileName,
          uid: uuidv4(),
        },
      ]);
      if (onSuccess) onSuccess("ok");
    } else {
      if (onError) {
        setDataLogo([]);
        const error = new Error(res.message);
        onError({ event: error });
      }
    }
  };

  return (
    <>
      {openModal && (
        <>
          <ModalForm
            title={<>{dataInit?.id ? "Cập nhật Company" : "Tạo mới Company"}</>}
            open={openModal}
            modalProps={{
              onCancel: () => {
                handleReset();
              },
              afterClose: () => handleReset(),
              destroyOnHidden: true,
              width: isMobile ? "100%" : 900,
              footer: null,
              keyboard: false,
              maskClosable: false,
              className: `modal-company ${animation}`,
              rootClassName: `modal-company-root ${animation}`,
            }}
            scrollToFirstError={true}
            preserve={false}
            form={form}
            onFinish={submitCompany}
            initialValues={dataInit?.id ? dataInit : {}}
            submitter={{
              render: (_: any, dom: any) => (
                <FooterToolbar>{dom}</FooterToolbar>
              ),
              submitButtonProps: {
                icon: <CheckSquareOutlined />,
              },
              searchConfig: {
                resetText: "Hủy",
                submitText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
              },
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <ProFormText
                  label="Tên công ty"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập tên công ty"
                />
              </Col>
              <Col span={12}>
                <ProFormText
                  label="Website"
                  name="website"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập trang web công ty"
                />
              </Col>
              <Col span={12}>
                <ProForm.Item
                  name="field"
                  label="Lĩnh vực"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                >
                  <AutoComplete
                    options={fieldOptions}
                    onSearch={(value) =>
                      handleSearch(value, FIELD_LIST, setFieldOptions)
                    }
                    placeholder="VD: Công nghệ thông tin"
                    allowClear
                  />
                </ProForm.Item>
              </Col>
              <Col span={12}>
                <ProForm.Item
                  name="country"
                  label="Quốc gia"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                >
                  <AutoComplete
                    options={countryOptions}
                    onSearch={(value) =>
                      handleSearch(value, COUNTRY_LIST, setCountryOptions)
                    }
                    placeholder="VD: Việt Nam"
                    allowClear
                  />
                </ProForm.Item>
              </Col>
              <Col span={12}>
                <ProFormSelect // Dùng Select để có các lựa chọn cố định
                  name="scale"
                  label="Quy mô"
                  options={[
                    { label: "Dưới 25", value: "0-25" },
                    { label: "25-100", value: "25-100" },
                    { label: "100-500", value: "100-500" },
                    { label: "Trên 500", value: "500+" },
                  ]}
                  placeholder="Chọn quy mô"
                  rules={[{ required: true, message: "Vui lòng chọn quy mô!" }]}
                />
              </Col>
              <Col span={12}>
                <ProFormDigit
                  label="Năm thành lập"
                  name="foundingYear"
                  placeholder="VD: 2024"
                  min={1900}
                  max={new Date().getFullYear()}
                  fieldProps={{ precision: 0 }}
                  rules={[
                    { required: true, message: "Vui lòng nhập năm thành lập!" },
                  ]}
                />
              </Col>

              <Col span={24}>
                <ProForm.Item
                  name="location"
                  label="Địa điểm"
                  rules={[
                    { required: true, message: "Vui lòng chọn địa điểm!" },
                  ]}
                >
                  <AutoComplete
                    options={locationOptions}
                    onSearch={handleLocationSearch}
                    placeholder="Nhập để tìm kiếm địa điểm..."
                    allowClear // Cho phép xóa nhanh
                  />
                </ProForm.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 24 }}
                  label="Ảnh Logo"
                  name="logo"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng không bỏ trống",
                      validator: () => {
                        if (dataLogo.length > 0) return Promise.resolve();
                        else return Promise.reject(false);
                      },
                    },
                  ]}
                >
                  <ConfigProvider locale={enUS}>
                    <Upload
                      name="logo"
                      listType="picture-card"
                      className="avatar-uploader"
                      maxCount={1}
                      multiple={false}
                      customRequest={handleUploadFileLogo}
                      beforeUpload={beforeUpload}
                      onChange={handleChange}
                      onRemove={(file) => handleRemoveFile(file)}
                      onPreview={handlePreview}
                      defaultFileList={
                        dataInit?.id
                          ? [
                              {
                                uid: uuidv4(),
                                name: dataInit?.logo ?? "",
                                status: "done",
                                url: `${import.meta.env.VITE_BACKEND_URL}/storage/company/${dataInit?.logo}`,
                              },
                            ]
                          : []
                      }
                    >
                      <div>
                        {loadingUpload ? <LoadingOutlined /> : <PlusOutlined />}
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    </Upload>
                  </ConfigProvider>
                </Form.Item>
              </Col>

              <Col span={16}>
                <ProFormTextArea
                  label="Địa chỉ"
                  name="address"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập địa chỉ công ty"
                  fieldProps={{
                    autoSize: { minRows: 4 },
                  }}
                />
              </Col>

              <ProCard
                title="Miêu tả"
                // subTitle="mô tả công ty"
                headStyle={{ color: "#d81921" }}
                style={{ marginBottom: 20 }}
                headerBordered
                size="small"
                bordered
              >
                <Col span={24}>
                  <ReactQuill theme="snow" value={value} onChange={setValue} />
                </Col>
              </ProCard>
            </Row>
          </ModalForm>
          <Modal
            open={previewOpen}
            title={previewTitle}
            footer={null}
            onCancel={() => setPreviewOpen(false)}
            style={{ zIndex: 1500 }}
          >
            <img alt="example" style={{ width: "100%" }} src={previewImage} />
          </Modal>
        </>
      )}
    </>
  );
};

export default ModalCompany;
