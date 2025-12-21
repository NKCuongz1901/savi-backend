export function buildTranactionPrompt(transcript: string) {
    return `
    Hãy chuyển đổi nội dung sau thành một object JSON với các trường BẮT BUỘC: 
    - type (loại giao dịch: "INCOME" hoặc "EXPENSE"), 
    - amount (số tiền, kiểu số), 
    - category (danh mục, kiểu chuỗi), 
    - note (ghi chú, kiểu chuỗi), 
    
    Danh sách category có sẵn:
    Thu nhập (INCOME): Lương, Tiền phụ cấp, Tiền thưởng, Thu nhập phụ, Đầu tư, Thu nhập khác
    Chi tiêu (EXPENSE): Ăn uống, Đi lại, Mua sắm, Gia đình, Giải trí, Tiền nhà, Điện nước, Giáo dục, Sức khỏe, Làm đẹp, Thể thao, Chi tiêu hàng tháng
    
    Lưu ý: 
    - Nếu category trong nội dung không khớp với danh sách trên, hãy trả về "Khác"
    - PHẢI trả về đầy đủ 4 trường: type, amount, category, note
    
    Nội dung: "${transcript}"
    
    Kết quả mong muốn:
    {
      "type": "INCOME" hoặc "EXPENSE",
      "amount": ...,
      "category": "...",
      "note": "..."
    }
    Chỉ trả về object JSON, không giải thích thêm.
      `;
}

export function buildAnalysisPrompt(transcript: string){
  return `Bạn là một trợ lý tài chính cá nhân thông minh và thân thiện. Hãy phân tích các giao dịch sau và đưa ra nhận xét, gợi ý chi tiêu như một chuyên gia tài chính, viết bằng tiếng Việt tự nhiên, giống như bạn đang nhắn tin trò chuyện với người dùng.

Dữ liệu giao dịch:
${transcript}

Hãy phân tích và trình bày nội dung theo thứ tự sau, nhưng viết dưới dạng đoạn văn (không dùng JSON hay bảng):

1. **Tổng quan tài chính:**  
   - Tổng thu, tổng chi, tỷ lệ tiết kiệm (%).  
   - Nhận xét ngắn gọn về tình hình tài chính tổng thể (ổn định, chi tiêu nhiều, tiết kiệm tốt,...).

2. **Phân tích chi tiêu theo từng danh mục:**  
   - Danh mục chi tiêu chính (ăn uống, mua sắm, di chuyển, giải trí, v.v.).  
   - Tỷ lệ phần trăm từng danh mục và nhận xét ngắn (ví dụ: "Ăn uống chiếm phần lớn, nên xem xét giới hạn lại").

3. **Xu hướng theo thời gian:**  
   - Ngày hoặc khoảng thời gian chi tiêu cao nhất.  
   - Mô tả thói quen hoặc pattern chi tiêu (ví dụ: chi nhiều vào cuối tuần, đầu tháng, buổi tối,...).

4. **Insights và gợi ý cải thiện:**  
   - Đưa ra các gợi ý cụ thể để tối ưu tài chính cá nhân (ví dụ: “Hạn chế mua sắm vào cuối tuần”, “Tăng tỷ lệ tiết kiệm lên 25% để đạt mục tiêu tài chính”).  

Phản hồi bằng tiếng Việt tự nhiên, thân thiện, rõ ràng. Không sử dụng JSON hoặc bảng, chỉ viết như một đoạn hội thoại hoặc tin nhắn từ trợ lý AI tài chính cá nhân gửi cho người dùng.
`
}