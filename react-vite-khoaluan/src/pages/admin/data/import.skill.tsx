import { App, Modal, Table } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";
import Exceljs from "exceljs";
import { Buffer } from "buffer";
import Dragger from "antd/lib/upload/Dragger";
import templateFile from "@/assets/template/skill.xlsx?url";
import { callBulkCreateSkillAPI } from "@/config/api";
import { Console } from "console";
import { ProFormUploadDragger } from "@ant-design/pro-components";

interface IProps {
  openModalImportSkill: boolean;
  setOpenModalImportSkill: (v: boolean) => void;
  reloadTable: () => void;
}

interface IDataImport {
  name: string;
}

const ImportSkill = (props: IProps) => {
  const { setOpenModalImportSkill, openModalImportSkill, reloadTable } = props;
  console.log("ImportSkill Props:", { openModalImportSkill, reloadTable });

  const { message, notification } = App.useApp();
  const [dataImport, setDataImport] = useState<IDataImport[]>([]);
  const [isSubmit, setIsSubmit] = useState<boolean>(false);

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
              console.log(`Row ${rowNumber} Values:`, row.values);
              const values = Array.isArray(row.values)
                ? row.values.slice(1)
                : [];
              const obj: any = {};
              keys.forEach((key, index) => {
                obj[key] = values[index] !== undefined ? values[index] : null;
              });
              console.log(`Row ${rowNumber} Object:`, obj);
              jsonData.push(obj);
              rowCount++;
            });
            jsonData = jsonData.map((item, index) => {
              return { ...item, id: index + 1 };
            });

            setDataImport(jsonData);
            console.log("data", jsonData);
          } catch (error) {
            message.error(
              "Failed to parse the file. Please check the file format."
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
    const dataSubmit = dataImport.map((item) => ({
      name: item.name.toString().trim(),
    }));
    console.log("dataSubmit", dataSubmit);
    const res = await callBulkCreateSkillAPI(dataSubmit);
    if (res?.data) {
      notification.success({
        message: "Bulk Create Users",
        description: `total Users= ${res.data?.total}.||.Success = ${res.data.success}.||.Error = ${res.data.failed}`,
      });
    }
    setIsSubmit(false);
    setOpenModalImportSkill(false);
    setDataImport([]);
    reloadTable();
  };

  return (
    <Modal
      title="Import data skill"
      width={"80vw"}
      open={openModalImportSkill}
      onOk={() => handleImport()}
      onCancel={() => {
        setOpenModalImportSkill(false);
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
      <ProFormUploadDragger
        name="file-upload-skill" // Quan trọng: Cần có name cho form item
        title="Kéo thả file vào đây hoặc nhấn để chọn"
        description={
          <>
            Support for a single upload. Only accept .csv, .xls, .xlsx . or
            &nbsp;
            <a
              href={templateFile}
              download
              onClick={(e) => e.stopPropagation()}
              // Ngăn lan truyền lên cha của Dragger
            >
              Download Sample File
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
          dataSource={dataImport}
          columns={[
            {
              title: "STT",
              key: "stt",
              render: (_, __, index) => index + 1,
            },
            { dataIndex: "name", title: "Tên Skill" },
          ]}
        />
      </div>
    </Modal>
  );
};

export default ImportSkill;
