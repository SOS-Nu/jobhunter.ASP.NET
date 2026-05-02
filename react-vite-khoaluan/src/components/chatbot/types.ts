// Dựa trên file formatCompanyToHTML.js của bạn
export interface ICompanyStub {
  id: string | number;
  name: string;
  city?: string; // Giả định bạn có trường city
}

// Dựa trên file formatJobToHTML.js của bạn
export interface IJobStub {
  id: string | number;
  name: string;
  salary: string;
  level: string;
  location: string;
}
