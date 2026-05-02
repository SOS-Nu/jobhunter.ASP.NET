// src/pages/user/CVTemplate_Modern.tsx

import React from "react";
import { IUser } from "@/types/backend";
import moment from "moment";

interface CVTemplateProps {
  userData: IUser;
  avatarUrl: string;
}

// Style cho mẫu Modern
const styles = {
  container: {
    display: "flex",
    width: "210mm",
    minHeight: "297mm",
    fontFamily: "'Calibri', 'Segoe UI', sans-serif",
    backgroundColor: "#fff",
    boxSizing: "border-box" as const,
  },
  sidebar: {
    width: "35%",
    backgroundColor: "#2c3e50", // Màu xanh đen
    color: "#fff",
    padding: "30px",
    boxSizing: "border-box" as const,
  },
  mainContent: {
    width: "65%",
    padding: "30px",
    boxSizing: "border-box" as const,
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "4px solid #fff",
    objectFit: "cover" as const,
    display: "block",
    margin: "0 auto 20px auto",
  },
  fullName: {
    fontSize: "26px",
    fontWeight: "600" as const,
    textAlign: "center" as const,
    color: "#fff",
    marginBottom: "5px",
  },
  title: {
    fontSize: "16px",
    textAlign: "center" as const,
    color: "#3498db",
    marginBottom: "30px",
  },
  sidebarSection: {
    marginBottom: "25px",
  },
  sidebarTitle: {
    fontSize: "18px",
    fontWeight: "bold" as const,
    color: "#fff",
    borderBottom: "2px solid #3498db",
    paddingBottom: "5px",
    marginBottom: "10px",
  },
  contactItem: {
    fontSize: "12px",
    marginBottom: "8px",
    wordBreak: "break-word" as const,
  },
  mainTitle: {
    fontSize: "24px",
    fontWeight: "bold" as const,
    color: "#2c3e50",
    marginBottom: "20px",
  },
  // ✅ SỬA LỖI 1: Tách style cho nội dung sidebar và nội dung chính
  sidebarContent: {
    // Style cho nội dung chữ trắng trên nền tối
    fontSize: "13px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
    color: "#fff",
  },
  mainContentText: {
    // Style cho nội dung chữ tối trên nền sáng
    fontSize: "13px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
    color: "#555",
  },
  workItem: {
    marginBottom: "15px",
    breakInside: "avoid" as const,
  },
  company: {
    fontSize: "16px",
    fontWeight: "bold" as const,
    color: "#3498db",
  },
  duration: {
    fontSize: "12px",
    fontStyle: "italic" as const,
    color: "#777",
    marginBottom: "5px",
  },
};

const CVTemplate_Modern: React.FC<CVTemplateProps> = ({
  userData,
  avatarUrl,
}) => {
  const { onlineResume, workExperiences } = userData;
  if (!onlineResume) return null;

  return (
    <div style={styles.container}>
      {/* Cột trái - Sidebar */}
      <div style={styles.sidebar}>
        <img src={avatarUrl} alt="Avatar" style={styles.avatar} />
        <h1 style={styles.fullName}>{onlineResume.fullName}</h1>
        <h2 style={styles.title}>{onlineResume.title}</h2>

        <div style={styles.sidebarSection}>
          <h3 style={styles.sidebarTitle}>Contact</h3>
          <p style={styles.contactItem}>📧 {onlineResume.email}</p>
          <p style={styles.contactItem}>📞 {onlineResume.phone}</p>
          <p style={styles.contactItem}>📍 {onlineResume.address}</p>
          {/* ✅ SỬA LỖI 2: Thêm ngày sinh */}
          {onlineResume.dateOfBirth && (
            <p style={styles.contactItem}>
              🎂 {moment(onlineResume.dateOfBirth).format("DD/MM/YYYY")}
            </p>
          )}
        </div>

        <div style={styles.sidebarSection}>
          <h3 style={styles.sidebarTitle}>Skills</h3>
          {/* Sử dụng style cho sidebar */}
          <div style={styles.sidebarContent}>
            {onlineResume.skills?.map((s) => s.name).join(", ")}
          </div>
        </div>

        <div style={styles.sidebarSection}>
          <h3 style={styles.sidebarTitle}>Languages</h3>
          {/* Sử dụng style cho sidebar */}
          <div style={styles.sidebarContent}>{onlineResume.languages}</div>
        </div>
      </div>

      {/* Cột phải - Nội dung chính */}
      <div style={styles.mainContent}>
        <section style={{ marginBottom: "30px" }}>
          <h3 style={styles.mainTitle}>Summary</h3>
          {/* Sử dụng style cho nội dung chính */}
          <p style={styles.mainContentText}>{onlineResume.summary}</p>
        </section>

        {workExperiences && workExperiences.length > 0 && (
          <section style={{ marginBottom: "30px" }}>
            <h3 style={styles.mainTitle}>Work Experience</h3>
            {workExperiences.map((exp) => (
              <div key={exp.id} style={styles.workItem}>
                <p style={styles.company}>{exp.companyName}</p>
                <p style={styles.duration}>
                  {moment(exp.startDate).format("MMM YYYY")} -{" "}
                  {exp.endDate
                    ? moment(exp.endDate).format("MMM YYYY")
                    : "Present"}{" "}
                  | {exp.location}
                </p>
                {/* Sử dụng style cho nội dung chính */}
                <div style={styles.mainContentText}>{exp.description}</div>
              </div>
            ))}
          </section>
        )}

        <section style={{ marginBottom: "30px" }}>
          <h3 style={styles.mainTitle}>Education</h3>
          {/* Sử dụng style cho nội dung chính */}
          <div style={styles.mainContentText}>{onlineResume.educations}</div>
        </section>

        <section>
          <h3 style={styles.mainTitle}>Certifications</h3>
          {/* Sử dụng style cho nội dung chính */}
          <div style={styles.mainContentText}>
            {onlineResume.certifications}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CVTemplate_Modern;
