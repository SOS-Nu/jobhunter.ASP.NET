import {
  Breadcrumb,
  Col,
  ConfigProvider,
  DatePicker,
  Divider,
  Form,
  Row,
  message,
  notification,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DebounceSelect } from "../user/debouce.select";
import {
  FooterToolbar,
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-components";
import styles from "styles/admin.module.scss";
import { LOCATION_LIST, SKILLS_LIST } from "@/config/utils";
import { ICompanySelect } from "../user/modal.user";
import { useState, useEffect } from "react";
import {
  callCreateJob,
  callCreateJobForCompany,
  callFetchAllSkill,
  callFetchCompany,
  callFetchJobById,
  callUpdateJob,
  callUpdateJobForCompany,
} from "@/config/api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { CheckSquareOutlined } from "@ant-design/icons";
import enUS from "antd/lib/locale/en_US";
import dayjs from "dayjs";
import { IJob, ISkill, IUser } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import viVN from "antd/lib/locale/vi_VN";
import { theme as antdTheme } from "antd";

import { useCurrentApp } from "@/components/context/app.context";

interface ISkillSelect {
  label: string;
  value: string;
  key?: string;
}

const ViewUpsertJob = (props: any) => {
  const [companies, setCompanies] = useState<ICompanySelect[]>([]);
  const [skills, setSkills] = useState<ISkillSelect[]>([]);

  const navigate = useNavigate();
  const [value, setValue] = useState<string>("");

  let location = useLocation();
  let params = new URLSearchParams(location.search);
  const id = params?.get("id"); // job id
  const [dataUpdate, setDataUpdate] = useState<IJob | null>(null);
  const [form] = Form.useForm();
  const user = useAppSelector((state) => state.account.user) as IUser;

  useEffect(() => {
    const init = async () => {
      const skillList = await fetchSkillList();
      setSkills(skillList);

      if (id) {
        const res = await callFetchJobById(id);
        if (res && res.data) {
          const jobData = res.data;
          setDataUpdate(jobData);
          setValue(jobData.description);

          // Chuẩn bị dữ liệu
          const skillsData = jobData.skills?.map((item: ISkill) => ({
            label: item.name,
            value: item.id,
            key: item.id,
          }));

          const companyData = {
            label: jobData.company?.name as string,
            value:
              `${jobData.company?.id}@#$${jobData.company?.logo}` as string,
            key: jobData.company?.id,
          };

          // Tạo một đối tượng để điền vào form
          const formPayload: any = {
            name: jobData.name,
            location: jobData.location,
            address: jobData.address,
            salary: jobData.salary,
            quantity: jobData.quantity,
            level: jobData.level,
            active: jobData.active,
            skills: skillsData,
            description: jobData.description,
            startDate: jobData.startDate ? dayjs(jobData.startDate) : undefined,
            endDate: jobData.endDate ? dayjs(jobData.endDate) : undefined,
          };

          // **FIX LỖI LOGIC TẠI ĐÂY**
          // Chỉ thêm và cập nhật field 'company' nếu user là SUPER_ADMIN
          if (user.role?.name === "SUPER_ADMIN") {
            formPayload.company = companyData;
            setCompanies([companyData]);
          }

          // Cập nhật form với dữ liệu đã được xử lý an toàn
          form.setFieldsValue(formPayload);
        }
      }
    };

    init();
    return () => form.resetFields();
  }, [id, user, form]); // Thêm user và form vào dependencies

  // Usage of DebounceSelect
  async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
    const res = await callFetchCompany(`page=1&size=100&name ~ '${name}'`);
    if (res && res.data) {
      const list = res.data.result;
      const temp = list.map((item) => {
        return {
          label: item.name as string,
          value: `${item.id}@#$${item.logo}` as string,
        };
      });
      return temp;
    } else return [];
  }

  async function fetchSkillList(): Promise<ISkillSelect[]> {
    const res = await callFetchAllSkill(`page=1&size=100`);
    if (res && res.data) {
      const list = res.data.result;
      const temp = list.map((item) => {
        return {
          label: item.name as string,
          value: `${item.id}` as string,
        };
      });
      return temp;
    } else return [];
  }

  const onFinish = async (values: any) => {
    // Logic xử lý skills giữ nguyên
    let arrSkills = [];
    if (typeof values?.skills?.[0] === "object") {
      arrSkills = values?.skills?.map((item: any) => ({ id: item.value }));
    } else {
      arrSkills = values?.skills?.map((item: any) => ({ id: +item }));
    }

    // --- BẮT ĐẦU SỬA TỪ ĐÂY ---

    // 1. Tạo đối tượng payload cơ bản không có trường 'company'
    const jobPayload: any = {
      name: values.name,
      skills: arrSkills,
      location: values.location,
      address: values.address,
      salary: values.salary,
      quantity: values.quantity,
      level: values.level,
      description: value,
      startDate: /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(values.startDate)
        ? dayjs(values.startDate, "DD/MM/YYYY").toDate()
        : values.startDate,
      endDate: /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(values.endDate)
        ? dayjs(values.endDate, "DD/MM/YYYY").toDate()
        : values.endDate,
      active: values.active,
    };

    // 2. Chỉ thêm trường 'company' nếu user là SUPER_ADMIN
    if (user.role?.name === "SUPER_ADMIN") {
      // Kiểm tra xem admin đã chọn công ty chưa
      if (!values.company?.value) {
        notification.error({ message: "Vui lòng chọn công ty." });
        return; // Dừng thực thi nếu chưa chọn
      }
      const cp = values.company.value.split("@#$");
      jobPayload.company = {
        id: cp[0],
        // Lấy tên công ty từ 'label' của select, không phải tên job
        name: values.company.label,
        logo: cp[1] || "",
      };
    }
    // Đối với các vai trò khác, không cần thêm trường 'company' vào payload.

    // 3. Gọi API với payload đã được xây dựng đúng
    let res;
    if (dataUpdate?.id) {
      // Update
      if (user.role?.name === "SUPER_ADMIN") {
        res = await callUpdateJob(jobPayload, dataUpdate.id);
      } else if (user.company?.id) {
        res = await callUpdateJobForCompany(jobPayload, dataUpdate.id);
      }
    } else {
      // Create
      if (user.role?.name === "SUPER_ADMIN") {
        res = await callCreateJob(jobPayload);
      } else if (user.company?.id) {
        // API call này sẽ nhận payload không có trường `company`, đúng như mong đợi
        res = await callCreateJobForCompany(jobPayload);
      }
    }

    // --- KẾT THÚC PHẦN SỬA ---

    if (res && res.data) {
      message.success(
        dataUpdate?.id ? "Cập nhật job thành công" : "Tạo mới job thành công"
      );
      navigate("/admin/job");
    } else {
      notification.error({
        message: "Có lỗi xảy ra",
        description: res?.message,
      });
    }
  };

  return (
    <div className={styles["upsert-job-container"]}>
      <div className={styles["title"]}>
        <Breadcrumb
          separator=">"
          items={[
            {
              title: <Link to="/admin/job">Manage Job</Link>,
            },
            {
              title: "Upsert Job",
            },
          ]}
        />
      </div>
      <div>
        <ConfigProvider locale={viVN}>
          <ProForm
            form={form}
            onFinish={onFinish}
            submitter={{
              searchConfig: {
                resetText: "Hủy",
                submitText: (
                  <>{dataUpdate?.id ? "Cập nhật Job" : "Tạo mới Job"}</>
                ),
              },
              onReset: () => navigate("/admin/job"),
              render: (_: any, dom: any) => (
                <FooterToolbar>{dom}</FooterToolbar>
              ),
              submitButtonProps: {
                icon: <CheckSquareOutlined />,
              },
            }}
          >
            <Row gutter={[20, 20]}>
              <Col span={24} md={12}>
                <ProFormText
                  label="Tên Job"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập tên job"
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormSelect
                  name="skills"
                  label="Kỹ năng yêu cầu"
                  options={skills}
                  placeholder="Please select a skill"
                  rules={[
                    { required: true, message: "Vui lòng chọn kỹ năng!" },
                  ]}
                  allowClear
                  mode="multiple"
                  fieldProps={{
                    suffixIcon: null,
                  }}
                />
              </Col>

              <Col span={24} md={6}>
                <ProFormSelect
                  name="location"
                  label="Địa điểm"
                  options={LOCATION_LIST.filter((item) => item.value !== "ALL")}
                  placeholder="Please select a location"
                  rules={[
                    { required: true, message: "Vui lòng chọn địa điểm!" },
                  ]}
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormText
                  name="address"
                  label="Địa chỉ"
                  placeholder="Please select a address"
                  rules={[
                    { required: true, message: "Vui lòng chọn địa điểm!" },
                  ]}
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormDigit
                  label="Mức lương"
                  name="salary"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập mức lương"
                  fieldProps={{
                    addonAfter: " đ",
                    formatter: (value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    parser: (value) =>
                      +(value || "").replace(/\$\s?|(,*)/g, ""),
                  }}
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormDigit
                  label="Số lượng"
                  name="quantity"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập số lượng"
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormSelect
                  name="level"
                  label="Trình độ"
                  valueEnum={{
                    INTERN: "INTERN",
                    FRESHER: "FRESHER",
                    JUNIOR: "JUNIOR",
                    MIDDLE: "MIDDLE",
                    SENIOR: "SENIOR",
                  }}
                  placeholder="Please select a level"
                  rules={[{ required: true, message: "Vui lòng chọn level!" }]}
                />
              </Col>

              {(dataUpdate?.id || !id) && user.role?.name === "SUPER_ADMIN" && (
                <Col span={24} md={6}>
                  <ProForm.Item
                    name="company"
                    label="Thuộc Công Ty"
                    rules={
                      user.role.name === "SUPER_ADMIN"
                        ? [
                            {
                              required: true,
                              message: "Vui lòng chọn company!",
                            },
                          ]
                        : undefined
                    }
                  >
                    <DebounceSelect
                      allowClear
                      showSearch
                      defaultValue={companies}
                      value={companies}
                      placeholder="Chọn công ty"
                      fetchOptions={fetchCompanyList}
                      onChange={(newValue: any) => {
                        if (newValue?.length === 0 || newValue?.length === 1) {
                          setCompanies(newValue as ICompanySelect[]);
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                  </ProForm.Item>
                </Col>
              )}
            </Row>
            <Row gutter={[20, 20]}>
              <Col span={24} md={6}>
                <ProForm.Item
                  label="Ngày bắt đầu"
                  name="startDate"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="dd/mm/yyyy"
                  />
                </ProForm.Item>
              </Col>

              <Col span={24} md={6}>
                <ProForm.Item
                  label="Ngày kết thúc"
                  name="endDate"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày kết thúc" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="dd/mm/yyyy"
                  />
                </ProForm.Item>
              </Col>
              <Col span={24} md={6}>
                <ProFormSwitch
                  label="Trạng thái"
                  name="active"
                  checkedChildren="ACTIVE"
                  unCheckedChildren="INACTIVE"
                  initialValue={true}
                  fieldProps={{
                    defaultChecked: true,
                  }}
                />
              </Col>
              <Col span={24}>
                <ProForm.Item
                  name="description"
                  label="Miêu tả job"
                  rules={[
                    { required: true, message: "Vui lòng nhập miêu tả job!" },
                  ]}
                >
                  <ReactQuill theme="snow" value={value} onChange={setValue} />
                </ProForm.Item>
              </Col>
            </Row>
            <Divider />
          </ProForm>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default ViewUpsertJob;
