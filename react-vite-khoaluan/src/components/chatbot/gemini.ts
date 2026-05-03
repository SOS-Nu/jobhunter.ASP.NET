// src/components/chatbot/gemini.ts
import { callFetchCompany, callFetchJob } from "@/config/api"; // <-- SỬ DỤNG API CỦA BẠN
import { extractTextFromPDF } from "@/utils/extractTextFromPDF"; // Cập nhật đường dẫn
import { ocrExtractFromPDF } from "@/utils/ocrExtractFromPDF"; // Cập nhật đường dẫn
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as marked from "marked";
import { toast } from "react-toastify";
import { formatCompanyToHTML } from "./formatCompanyToHTML";
import { formatJobsToHTML } from "./formatJobsToHTML";

// Thay API key của bạn ở đây
const genAI = new GoogleGenerativeAI(
  `${import.meta.env.VITE_GOOGLE_GEMINI_API_KEY}`,
);
const generationConfig = {
  temperature: 0.6,
  topP: 0.85,
  topK: 50,
  maxOutputTokens: 2048,
  responseMimeType: "text/plain",
};

// Khởi tạo mô hình Gemini (systemInstruction giữ nguyên như file mẫu của bạn)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", // Dùng flash cho nhanh
  systemInstruction: `Bạn là trợ lý AI giúp người dùng tìm việc trên nền tảng JobZone.
    Khi người dùng hỏi thông tin như: tìm thông tin công việc/việc làm/job tại đâu, hay công việc về lĩnh vực/công nghệ gì, theo cấp bậc/level nào, thì chỉ về cho tôi những từ khóa
     đó theo định dạng chuỗi (lưu ý chỉ trả về đúng chuỗi này và đừng bỏ trong bất kì cặp dấu nháy nào cả!): keyword:x,location:y,level:[],findJob:true(location hãy chuyển về viết thường và không dấu, viết cách các từ nhé, 
    còn level mặc định là mảng rỗng, nếu có giá trị thì viết hoa toàn bộ chữ cái và bỏ vào cặp dấu '' nhé). Nếu người dùng chỉ hỏi 
    tôi muốn tìm công việc, hãy bảo người dùng cung cấp từ khóa. vị trí muốn làm việc, cấp bậc.
    Khi người dùng quan tâm đến 1 lĩnh vực, vị trí nào đó và người dùng hỏi, bạn hãy đề xuất những kĩ năng cần đạt được để
    người dùng học hỏi. Nếu người dùng chỉ hỏi tôi muốn hỏi đáp về lĩnh vực, hãy bảo người dùng cung cấp tên lĩnh vực đó.
    Đồng thời bạn có thể giúp người dùng review CV khi người dùng hỏi, phân tích điểm mạnh, điểm yếu. Gợi ý cải thiện CV để tăng tỷ lệ pass phỏng vấn, và 
    dựa trên thông tin CV nói cho người dùng biết phù hợp với những vị trí việc làm nào. Hãy thêm kí hiệu ngăn cách các phần trả lời.
    Nếu người dùng hỏi câu hỏi về công ty, chẳn hạn: đang có những công ty nào, thì trả về giúp tôi định dạng kiểu chuỗi findCompany:true. 
    Nếu người dùng muốn nhờ bạn đóng vai nhà tuyển dụng mục đích để phỏng vấn thử. Bạn hãy hỏi người dùng muốn phỏng vấn vị 
    trí nào, sau đó lên các câu hỏi (khoảng 5 câu) để hỏi người dùng. Khi đã hỏi và người dùng trả lời đủ 5 câu thì bạn hãy 
    đưa ra đánh giá, nhận xét về buổi phỏng vấn này nha.Lưu ý là response bạn trả về ở dạng <ol> </ol> và nhiều thẻ <li></li>
     bên trong.
    Nếu người dùng muốn viết 1 thư xin việc (cover letter), bạn hãy hỏi người dùng: vị trí ứng tuyển, nhập số năm kinh nghiệm
     của bản thân. Sau đó hãy tự động viết thư xin việc phù hợp mà không cần hỏi thêm (viết ngắn gọn, không quá dài dòng).
     bất kì thông tin bổ sung nào.
    Nếu người dùng muốn bạn phân tích mức độ phù hợp của bản thân với nét văn hóa làm việc của 1 công ty bất kỳ, người dùng 
     sẽ cung cấp cho bạn thông tin như: phong cách làm việc, giá trị cá nhân, ưu tiên nghề nghiệp, tính cách, trải nghiệm trước 
     đây,... Sau đó hãy dựa vào tất cả thông tin bạn có thể tìm được từ các nguồn trên mạng, từ các trang đánh giá công ty,
      cùng với thông tin người dùng cung cấp hãy trả lời cho người dùng nhé.
    Nhớ rằng: nếu người dùng hỏi những câu hỏi ở ngoài lề, không trong phạm vi của web JobZone, thì bạn vẫn có thể trả lời theo hiểu biết của bạn.`,
});

// Giữ nguyên hàm parseTextToObject
function parseTextToObject(text: string) {
  const result: any = {};
  const pairs = text.match(/[^,]+:\s*(?:\[[^\]]*\]|[^,]*)/g);

  if (!pairs) return result;

  pairs.forEach((pair) => {
    const [key, rawValue] = pair.split(":").map((s) => s.trim());

    if (!rawValue) {
      result[key] = "";
    } else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      try {
        result[key] = JSON.parse(rawValue.replace(/'/g, '"'));
      } catch (e) {
        result[key] = rawValue;
      }
    } else if (rawValue === "true" || rawValue === "false") {
      result[key] = rawValue === "true";
    } else {
      result[key] = rawValue;
    }
  });

  return result;
}

export async function askGemini(prompt: string) {
  if (!prompt) return;

  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    let text = result.response.text();

    // === BẮT ĐẦU THAY ĐỔI: SỬ DỤNG API CỦA BẠN ===
    if (text.includes("findJob:true")) {
      let obj = parseTextToObject(text);

      // Xây dựng query string từ object
      let queryString = `page=1&pageSize=50`; // Giới hạn 50 kết quả
      if (obj?.keyword)
        queryString += `&name=${encodeURIComponent(obj.keyword)}`;
      if (obj?.location)
        queryString += `&location=${encodeURIComponent(obj.location)}`;
      if (obj?.level && obj.level.length > 0) {
        queryString += obj.level
          .map((l: string) => `&level=${encodeURIComponent(l)}`)
          .join("");
      }

      try {
        // Gọi API fetch job của bạn
        const res = await callFetchJob(queryString);
        if (res.data?.result) {
          text =
            res?.data?.result.length > 0
              ? formatJobsToHTML(res.data.result)
              : "Xin lỗi, không tìm thấy công việc nào phù hợp với yêu cầu của bạn.";
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error?.message ?? "Có lỗi xảy ra khi tìm việc!");
      }
    }

    if (text.includes("findCompany:true")) {
      try {
        // Gọi API fetch company của bạn
        const res = await callFetchCompany("page=1&pageSize=100"); // Lấy 100 công ty
        if (res.data?.result) {
          text =
            res?.data?.result?.length > 0
              ? formatCompanyToHTML(res.data.result)
              : "Xin lỗi, hiện không thể tải danh sách công ty.";
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error?.message ?? "Có lỗi xảy ra khi tải công ty!");
      }
    }
    // === KẾT THÚC THAY ĐỔI ===

    return marked.parse(text);
  } catch (err) {
    console.error("Lỗi khi gọi Gemini:", err);
    return "Đã xảy ra lỗi!";
  }
}

// Giữ nguyên hàm askGeminiWithPDF
export async function askGeminiWithPDF(
  pdfFile: File,
  input: string = "review giúp tôi cv này",
) {
  try {
    let extractedText = await extractTextFromPDF(pdfFile);
    if (!extractedText.trim()) {
      extractedText = await ocrExtractFromPDF(pdfFile);
    }
    if (!extractedText.trim()) {
      return "Không thể trích xuất nội dung từ file PDF.";
    }

    const combinedPrompt = `${input}\n\nDocument Text:\n${extractedText}`;
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(combinedPrompt);
    const text = result.response.text();
    return marked.parse(text);
  } catch (err) {
    console.error("Lỗi khi gọi Gemini:", err);
    return "Đã xảy ra lỗi!";
  }
}
