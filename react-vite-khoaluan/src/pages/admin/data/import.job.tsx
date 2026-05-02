import {
  App,
  ConfigProvider,
  Modal,
  Table,
  theme as antdTheme,
  theme,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadProps } from "antd";
import { use, useState } from "react";
import Exceljs from "exceljs";
import { Buffer } from "buffer";
import Dragger from "antd/lib/upload/Dragger";
import templateFile from "@/assets/template/job.xlsx?url";
import { callBulkCreateJobAPI } from "@/config/api";
import { Console } from "console";
import { useCurrentApp } from "@/components/context/app.context";
import { ProFormUploadDragger } from "@ant-design/pro-components";

interface IProps {
  openModalImportJob: boolean;
  setOpenModalImportJob: (v: boolean) => void;
  reloadTable: () => void;
}

interface IDataImport {
  name: string;
  location: string;
  address: string;
  salary: string;
  company: number;
  quantity: number;
  level: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  skills: {
    id: number;
  }[];
  id?: number; // Thêm id vào interface
}

interface IDataSubmit {
  name: string;
  location: string;
  address: string;
  salary: string;
  company: { id: number };
  quantity: number;
  level: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  skills: {
    id: number;
  }[];
}

interface IDataShow {
  name: string;
  location: string;
  address: string;
  salary: string;
  company: number;
  quantity: number;
  level: string;
  description: string;
  startDate: string;
  endDate: string;
  active: string;
  skills: {
    id: number;
  }[];
  id?: number; // Thêm id vào interface
}

const ImportJob = (props: IProps) => {
  const { setOpenModalImportJob, openModalImportJob, reloadTable } = props;
  console.log("ImportJob Props:", { openModalImportJob, reloadTable });

  const { message, notification } = App.useApp();
  const [dataImport, setDataImport] = useState<IDataImport[]>([]);
  const [dataShow, setDataShow] = useState<IDataShow[]>([]);
  const { theme } = useCurrentApp();

  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  console.log("dataimport", dataImport);

  // Polyfill Buffer
  window.Buffer = window.Buffer || Buffer;

  const propsUpload: UploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    accept:
      ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    customRequest({ file, onSuccess }) {
      setTimeout(() => {
        if (onSuccess) onSuccess("ok");
      }, 1000);
    },
    async onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
        if (info.fileList && info.fileList.length > 0) {
          const file = info.fileList[0].originFileObj!;
          console.log("Uploaded File:", file);

          try {
            const workbook = new Exceljs.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            console.log("ArrayBuffer Size:", arrayBuffer.byteLength);
            const buffer = Buffer.from(arrayBuffer);
            console.log("Buffer Created:", buffer.length);
            await workbook.xlsx.load(arrayBuffer);

            console.log(
              "Worksheets:",
              workbook.worksheets.map((sheet) => sheet.name)
            );
            let jsonData: IDataImport[] = [];
            const sheet = workbook.worksheets[0];
            if (!sheet) {
              message.error("No valid worksheet found in the file.");
              console.log("Error: No worksheet found");
              return;
            }

            const firstRow = sheet.getRow(1);
            console.log("First Row Cell Count:", firstRow.cellCount);
            console.log("First Row Values:", firstRow.values);
            if (!firstRow.cellCount || !firstRow.values) {
              message.error("No header row found in the file.");
              return;
            }

            const keys = Array.isArray(firstRow.values)
              ? firstRow.values
                  .slice(1)
                  .map((key) => (key ? key.toString().trim() : ""))
              : [];
            console.log("Header Keys:", keys);
            if (keys.length === 0) {
              message.error("No valid headers found in the file.");
              return;
            }

            let rowCount = 0;
            sheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return;
              const values = Array.isArray(row.values)
                ? row.values.slice(1)
                : [];
              const obj: any = {};
              keys.forEach((key, index) => {
                if (key === "skills" && values[index]) {
                  // Parse chuỗi skills: "[id 1],[id 2]" thành [{ id: 1 }, { id: 2 }]
                  const skillsStr = values[index].toString(); // Đảm bảo là chuỗi
                  //   console.log("skillsStr", skillsStr.split(","));
                  //   console.log("values[index]", values[index]);

                  const skillIds = skillsStr
                    .split(",") // Tách thành mảng: ["[id 1]", "[id 2]"]
                    .map((idStr: string) => {
                      const idNum = parseInt(
                        idStr.replace(/\[id\s*/, "").replace("]", "")
                      ); // Lấy số: 1, 2
                      return { id: idNum };
                    });
                  obj[key] = skillIds;
                } else {
                  obj[key] = values[index] !== undefined ? values[index] : null;
                }
              });
              jsonData.push(obj);
            });
            jsonData = jsonData.map((item, index) => {
              return { ...item, id: index + 1 };
            });

            const dataShow = jsonData.map((item) => ({
              ...item,
              active: item.active === true ? "true" : "false",
            }));
            console.log("dataShow", dataShow);

            setDataImport(jsonData);
            setDataShow(dataShow);
            console.log("data", jsonData);
          } catch (error) {
            message.error(
              "Failed to parse the file. Please check the file format.."
            );
          }
        }
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleImport = async () => {
    setIsSubmit(true);
    //khi tham số đầu vào tách ra là id , ...item thì đã tách id ra khỏi item , khi ...item thì không có trường id nữa
    const dataSubmit: IDataSubmit[] = dataImport.map(({ id, ...item }) => ({
      ...item,
      company: { id: item.company },
      skills: item.skills.map((skill: { id: number }) => ({ id: skill.id })),
      //item là mỗi phần trong mảng skills , trong trường hợp này nó là {"id": 1}
      // Lặp qua từng phần tử trong skills
    }));
    console.log("dataSubmit", dataSubmit);
    const res = await callBulkCreateJobAPI(dataSubmit);
    if (res?.data) {
      notification.success({
        message: "Bulk Create Jobs",
        description: `total Jobs= ${res.data?.total}.||.Success = ${res.data.success}.||.Error = ${res.data.failed}`,
      });
    }
    setIsSubmit(false);
    setOpenModalImportJob(false);
    setDataImport([]);
    reloadTable();
  };

  return (
    <Modal
      title="Import data jobs"
      width={"80vw"}
      open={openModalImportJob}
      onOk={() => handleImport()}
      onCancel={() => {
        setOpenModalImportJob(false);
        setDataImport([]);
      }}
      okText="Import data"
      okButtonProps={{
        disabled: dataImport.length > 0 ? false : true,
        loading: isSubmit,
      }}
      maskClosable={false}
      destroyOnHidden={true}
    >
       {" "}
      <ProFormUploadDragger
        name="file" // Quan trọng: Cần có name cho form item
        title="Kéo thả file vào đây hoặc nhấn để chọn"
        description={
          <>
            Chỉ hỗ trợ file .xlsx, .xls, .csv. Tải file mẫu&nbsp;
            <a
              href={templateFile}
              download
              onClick={(e) => e.stopPropagation()}
            >
              tại đây
            </a>
          </>
        }
        fieldProps={{
          ...propsUpload, // Truyền các props xử lý file của bạn vào đây
        }}
      />
      <div style={{ paddingTop: 20 }}>
        <Table
          rowKey={"id"}
          key={dataImport.length}
          title={() => <span>Dữ liệu upload:</span>}
          dataSource={dataShow}
          columns={[
            {
              title: "STT",
              key: "stt",
              render: (_, __, index) => index + 1,
            },
            { dataIndex: "name", title: "Tên hiển thị" },
            { dataIndex: "location", title: "Địa điểm" },
            { dataIndex: "address", title: "Địa chỉ" },
            { dataIndex: "salary", title: "Lương" },
            { dataIndex: "quantity", title: "Số lượng" },
            { dataIndex: "level", title: "Cấp độ" },
            { dataIndex: "description", title: "Mô tả" },
            { dataIndex: "startDate", title: "Ngày bắt đầu" },
            { dataIndex: "endDate", title: "Ngày kết thúc" },
            { dataIndex: "active", title: "Trạng thái" },
            // {
            //   dataIndex: "company",
            //   title: "Công ty",
            //   render: (company) => company?.id || "N/A",
            // },
            // {
            //   dataIndex: "skills",
            //   title: "Kỹ năng",
            //   render: (skills) =>
            //     skills?.map((skill: { id: number }) => skill.id).join(", ") ||
            //     "N/A",
            // },
          ]}
        />
      </div>
    </Modal>
  );
};

export default ImportJob;
