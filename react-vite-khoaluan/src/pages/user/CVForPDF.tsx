// src/pages/user/CVForPDF.tsx

import React from "react";
import { IUser } from "@/types/backend";
import moment from "moment";

interface CVForPDFProps {
  userData: IUser;
  avatarUrl: string; // Thêm prop cho URL avatar
}

// Các style inline để đảm bảo html2pdf đọc được
const styles = {
  container: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    padding: "35px",
    color: "#333",
    width: "210mm",
    minHeight: "297mm", // Chiều cao tối thiểu của A4
    backgroundColor: "#fff",
    boxSizing: "border-box" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    borderBottom: "2px solid #f2f2f2",
    paddingBottom: "20px",
    marginBottom: "20px",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover" as const,
    marginRight: "25px",
    border: "3px solid #eee",
  },
  headerInfo: {
    flexGrow: 1,
  },
  fullName: {
    fontSize: "28px",
    fontWeight: "bold" as const,
    margin: "0 0 5px 0",
    color: "#2c3e50",
  },
  title: {
    fontSize: "18px",
    fontWeight: "normal" as const,
    color: "#3498db",
    margin: 0,
  },
  contactInfo: {
    fontSize: "11px",
    color: "#555",
    marginTop: "15px",
    listStyle: "none",
    padding: 0,
  },
  contactItem: {
    marginBottom: "4px",
  },
  mainContent: {
    display: "flex",
    gap: "30px",
  },
  leftColumn: {
    width: "65%",
  },
  rightColumn: {
    width: "35%",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold" as const,
    color: "#3498db",
    borderBottom: "2px solid #3498db",
    paddingBottom: "5px",
    marginBottom: "15px",
  },
  content: {
    fontSize: "13px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const, // Giữ lại các dòng xuống hàng
    color: "#555",
  },
  workItem: {
    marginBottom: "15px",
    breakInside: "avoid" as const,
  },
  company: {
    fontSize: "15px",
    fontWeight: "bold" as const,
    color: "#2c3e50",
  },
  duration: {
    fontSize: "11px",
    fontStyle: "italic" as const,
    color: "#777",
    marginBottom: "5px",
  },
  skills: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
  skillTag: {
    backgroundColor: "#eaf2f8",
    color: "#3498db",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: "500" as const,
  },
};

const CVForPDF: React.FC<CVForPDFProps> = ({ userData, avatarUrl }) => {
  const { onlineResume, workExperiences } = userData;

  if (!onlineResume) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <img src={avatarUrl} alt="Avatar" style={styles.avatar} />
        <div style={styles.headerInfo}>
          <h1 style={styles.fullName}>{onlineResume.fullName}</h1>
          <h2 style={styles.title}>{onlineResume.title}</h2>
          <ul style={styles.contactInfo}>
            <li style={styles.contactItem}>📧 {onlineResume.email}</li>
            <li style={styles.contactItem}>📞 {onlineResume.phone}</li>
            <li style={styles.contactItem}>📍 {onlineResume.address}</li>
            {onlineResume.dateOfBirth && (
              <li style={styles.contactItem}>
                🎂 {moment(onlineResume.dateOfBirth).format("DD/MM/YYYY")}
              </li>
            )}
          </ul>
        </div>
      </header>

      <main style={styles.mainContent}>
        {/* Cột trái */}
        <div style={styles.leftColumn}>
          {/* Summary */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Summary</h3>
            <p style={styles.content}>{onlineResume.summary}</p>
          </section>

          {/* Work Experience */}
          {workExperiences && workExperiences.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Work Experience</h3>
              {workExperiences.map((exp) => (
                <div key={exp.id} style={styles.workItem}>
                  <p style={styles.company}>
                    {exp.companyName} | {exp.location}
                  </p>
                  <p style={styles.duration}>
                    {moment(exp.startDate).format("MMM YYYY")} -{" "}
                    {exp.endDate
                      ? moment(exp.endDate).format("MMM YYYY")
                      : "Present"}
                  </p>
                  <div style={styles.content}>{exp.description}</div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Cột phải */}
        <div style={styles.rightColumn}>
          {/* Skills */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Skills</h3>
            <div style={styles.skills}>
              {onlineResume.skills?.map((skill) => (
                <span key={skill.id} style={styles.skillTag}>
                  {skill.name}
                </span>
              ))}
            </div>
          </section>

          {/* Education */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Education</h3>
            <div style={styles.content}>{onlineResume.educations}</div>
          </section>

          {/* Certifications */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Certifications</h3>
            <div style={styles.content}>{onlineResume.certifications}</div>
          </section>

          {/* Languages */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Languages</h3>
            <div style={styles.content}>{onlineResume.languages}</div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CVForPDF;
