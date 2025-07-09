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