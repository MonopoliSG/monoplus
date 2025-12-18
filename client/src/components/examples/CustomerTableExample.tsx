import { CustomerTable, type Customer } from "../CustomerTable";

const mockCustomers: Customer[] = [
  {
    id: "1",
    musteriIsmi: "Ahmet Yılmaz",
    meslekGrubu: "Mühendis",
    tcKimlik: "12345678901",
    sehir: "İstanbul",
    ilce: "Kadıköy",
    gsmNo: "0532 123 4567",
    anaBrans: "Kasko",
    araBrans: "Trafik",
    kvkk: "Evet",
  },
  {
    id: "2",
    musteriIsmi: "Fatma Demir",
    meslekGrubu: "Doktor",
    tcKimlik: "98765432109",
    sehir: "Ankara",
    ilce: "Çankaya",
    gsmNo: "0533 987 6543",
    anaBrans: "Sağlık",
    araBrans: "Tamamlayıcı",
    kvkk: "Evet",
  },
];

export default function CustomerTableExample() {
  return (
    <div className="p-4">
      <CustomerTable
        customers={mockCustomers}
        onViewCustomer={(c) => console.log("View:", c.musteriIsmi)}
        onAnalyzeCustomer={(c) => console.log("Analyze:", c.musteriIsmi)}
      />
    </div>
  );
}
