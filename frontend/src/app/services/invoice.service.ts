import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private domain = "http://localhost:4000";
  // private domain = "http://192.168.0.254:4000";
  // private domain = "https://glm84bs6-4000.asse.devtunnels.ms";

  private agentUrl = `${this.domain}/api/sales-agents`;
  private apiUrl = `${this.domain}/api/invoices`;
  private detailUrl = `${this.domain}/api/invoice-details`;
  private filteredIVUrl = `${this.domain}/filtered-invoices`;
  private creditNoteUrl = `${this.domain}/api/credit-notes`;
  private creditNoteDetailsUrl = `${this.domain}/api/credit-notes-details`;
  private filteredCNUrl = `${this.domain}/filtered-credit-notes`;
  private getBranchUrl = `${this.domain}/api/get-branch-details`;
  private getLoginUrl = `${this.domain}/sales-login`;
  private changePasswordUrl = `${this.domain}/change-password`;

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

  getBranchDetails(branchCode: string, DeliverAddr1: string, isLensoDB: boolean) {
    const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
    const url = branchCode ? `${this.getBranchUrl}?branchCode=${branchCode}&deliverAddr1=${DeliverAddr1}&db=${dbParam}` : this.getBranchUrl;
    return this.http.get<any[]>(url);
  }

  getLoginDetails(username: string, password: string) {
    const url = (username && password) ? `${this.getLoginUrl}?username=${username}&password=${password}` : this.getLoginUrl;
    return this.http.get<any[]>(url);
  }

  changePassword(username: string, newPassword: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(this.changePasswordUrl, {
      username,
      newPassword,
    });
  }
}
