export async function getAllInvoiceIds(): Promise<string[]> {
  try {
    // Use appApi-compatible URL (works in both dev and MSI builds)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/billing/invoices`
      : '/api/billing/invoices';
    
    const res = await fetch(apiUrl);
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
