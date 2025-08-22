export async function getAllInvoiceIds(): Promise<string[]> {
  try {
    const res = await fetch('http://localhost:8000/api/billing/invoices');
    if (!res.ok) {
      console.error('Failed to fetch invoice IDs');
      return [];
    }
    const invoices = await res.json();
    // Assuming invoices is an array of objects with 'id' property
    return invoices.map((invoice: { id: string }) => invoice.id);
  } catch (error) {
    console.error('Error fetching invoice IDs:', error);
    return [];
  }
}
