import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private domain = "http://localhost:3000";
  // private domain = "http://192.168.0.254:82";

  private agentUrl = `${this.domain}/api/sales-agents`;
  private apiUrl = `${this.domain}/api/invoices`;
  private detailUrl = `${this.domain}/api/invoice-details`;
  private filteredIVUrl = `${this.domain}/filtered-invoices`;
  private creditNoteUrl = `${this.domain}/api/credit-notes`;
  private creditNoteDetailsUrl = `${this.domain}/api/credit-notes-details`;
  private filteredCNUrl = `${this.domain}/filtered-credit-notes`;

  constructor(private http: HttpClient) { }

  getInvoices(salesAgent?: string, isLensoDB?: boolean): Observable<any[]> {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    const url = salesAgent ? `${this.apiUrl}?salesAgent=${salesAgent}&db=${dbParam}` : this.apiUrl;
    return this.http.get<any[]>(url);
  }

  getSalesAgents(): Observable<any[]> {
    return this.http.get<any[]>(this.agentUrl);
  }

  getInvoiceDetails(docKey: number, isLensoDB: boolean): Observable<any[]> {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    return this.http.get<any[]>(`${this.detailUrl}?docKey=${docKey}&db=${dbParam}`);
  }

  getCreditNote(salesAgent?: string, isLensoDB?: boolean): Observable<any[]> {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    const url = salesAgent ? `${this.creditNoteUrl}?salesAgent=${salesAgent}&db=${dbParam}` : this.creditNoteUrl;
    return this.http.get<any[]>(url);
  }

  getCreditNoteDetails(docKey: number, isLensoDB: boolean): Observable<any[]> {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    return this.http.get<any[]>(`${this.creditNoteDetailsUrl}?docKey=${docKey}&db=${dbParam}`);
  }

  getFilteredInvoices(salesAgent: string, startDate: string, endDate: string, shipInfo: string[], isLensoDB: boolean) {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    return this.http.get<any[]>(`${this.filteredIVUrl}?db=${dbParam}`, {
      params: {
        salesAgent,
        startDate,
        endDate,
        shipInfo: JSON.stringify(shipInfo)
      }
    });
  }

  getFilteredCreditNotes(salesAgent: string, startDate: string, endDate: string, shipInfo: string[], isLensoDB: boolean) {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    return this.http.get<any[]>(`${this.filteredCNUrl}?db=${dbParam}`, {
      params: {
        salesAgent,
        startDate,
        endDate,
        shipInfo: JSON.stringify(shipInfo)
      }
    });
  }
}
