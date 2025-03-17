import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../services/invoice.service';
import { AuthService } from '../../services/auth.services';
import { lastValueFrom } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule, MatDateRangeInput } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatMenuModule } from '@angular/material/menu';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Router } from '@angular/router';
import autoTable, { ThemeType } from 'jspdf-autotable';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';

const moment = _rollupMoment || _moment;

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};

@Component({
  selector: 'app-invoice-table',
  standalone: true,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  imports: [CommonModule, MatDatepickerModule, MatSelectModule, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, MatIconModule, MatSlideToggleModule, MatCheckboxModule],
  templateUrl: './invoice-table.component.html',
  styleUrls: ['./invoice-table.component.css']
})
export class InvoiceTableComponent implements OnInit {
  @ViewChild(MatDateRangeInput) dateRangeInput!: MatDateRangeInput<Date>;
  allOption: boolean = true;
  startDate: Date = moment().startOf('isoWeek').toDate();
  endDate: Date = moment().endOf('isoWeek').toDate();
  filterReportForm!: FormGroup;

  selectedDocKey: number | null = null;
  invoices: any[] = [];
  salesAgent: string = "";
  invoiceDetails: any[] = [];
  isLoading: boolean = false;
  isLensoDB: boolean = false;
  showCarton: boolean = false;

  shipInfo = new FormControl<string[]>([])
  shipInfoList: any[] = [
    { id: 'BA', value: 'BA - VEGA' },
    { id: 'BB', value: 'BB - ATLASBX' },
    { id: 'BC', value: 'BC - MF POWER' },
    { id: 'LA', value: 'LA - WIN' },
    { id: 'LB', value: 'LB - MOTUL' },
    { id: 'LC', value: 'LC - BEAST' },
    { id: 'LD', value: 'LD - KROON-OIL' },
    { id: 'OT', value: 'OT - AGING TIRE' },
    { id: 'TA', value: 'TA - RYDANZ' },
    { id: 'TB', value: 'TB - MARSHAL' },
    { id: 'TC', value: 'TC - NOKIAN' },
    { id: 'TD', value: 'TD - LENSO TIRE' },
    { id: 'TE', value: 'TE - TBR' }
  ];

  shipInfoTotals: { [key: string]: number } = {};
  shipInfoQtyTotals: { [key: string]: number } = {};
  shipInfoLitreTotals: { [key: string]: number } = {};
  shipInfoLength: { [key: string]: number } = {};

  debtorSubTotals: { [key: string]: number } = {};
  debtorQtyTotals: { [key: string]: number } = {};
  debtorLitreTotals: { [key: string]: number } = {};
  debtorLength: { [key: string]: number } = {};

  docSubTotals: { [key: string]: number } = {};
  docQtyTotals: { [key: string]: number } = {};
  docLitreTotals: { [key: string]: number } = {};
  docLength: { [key: string]: number } = {};

  debtorTotals: {
    [key: string]: {
      DebtorName: string;
      ShipInfo: string;
      SubTotal: number;
      Qty: number;
      Litres: number;
    }
  } = {};

  grandSubTotal: number = 0;
  grandQtyTotal: number = 0;

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get logged-in sales agent
    this.salesAgent = this.authService.getLoggedInUser() ?? '';

    if (this.salesAgent) {
      this.shipInfo.setValue(['all', 'BA/BB', ...this.shipInfoList.map(ship => ship.id)]);
      this.fetchInvoices();
    }
    else {
      this.router.navigate(['/login']); // Redirect to login page
    }
  }

  toggleDB() {
    this.applyFilter();
  }

  async fetchInvoices(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await lastValueFrom(this.invoiceService.getInvoices(this.salesAgent, this.isLensoDB));
      this.invoices = data;
      this.invoiceDetails = [];

      const fetchDetailsPromises = this.invoices.map(invoice =>
        lastValueFrom(this.invoiceService.getInvoiceDetails(invoice.DocKey, this.isLensoDB)).then(details => {
          let fullDebtorName = invoice.DebtorName;
          if (invoice.BranchCode) {
            fullDebtorName += ` [${invoice.BranchCode.trim() ?? ''}]`;
          }
          const enrichedDetails = details.map(detail => ({
            ...detail,
            DocNo: invoice.DocNo,
            DebtorName: fullDebtorName,
            ShipInfo: detail.ProjNo,
            DocDate: invoice.DocDate
          }));

          this.invoiceDetails = [...this.invoiceDetails, ...enrichedDetails];

          this.invoiceDetails.forEach((invoice) => {
            if (invoice.ProjNo[0] == "L") {
              const regex = /(\d+)X[\d.]+L/g;
              let match;
              while ((match = regex.exec(invoice.Description)) !== null) {
                invoice.Ctn = invoice.Qty / parseInt(match[1]);
              }
            }
          });
        }).catch(error => console.error(`Error fetching details for DocKey ${invoice.DocKey}:`, error))
      );

      await Promise.all(fetchDetailsPromises);

      const start = moment(this.startDate).format("YYYY-MM-DD");
      const end = moment(this.endDate).format("YYYY-MM-DD");
      const selectedShipInfo = this.shipInfo.value!;

      try {
        const creditNoteList = await lastValueFrom(
          this.invoiceService.getFilteredCreditNotes(this.salesAgent, start, end, selectedShipInfo, this.isLensoDB)
        );

        creditNoteList.forEach(creditNote => {
          let fullDebtorName = creditNote.DebtorName;
          if (creditNote.BranchCode) {
            fullDebtorName += ` [${creditNote.BranchCode.trim() ?? ''}]`;
          }

          const tmp = {
            DebtorName: fullDebtorName,
            Description: creditNote.Description,
            DocDate: creditNote.DocDate,
            DocNo: creditNote.DocNo,
            ItemCode: creditNote.ItemCode,
            Qty: creditNote.Qty * -1,
            ShipInfo: creditNote.ProjNo,
            ProjNo: creditNote.ProjNo,
            SmallestQty: creditNote.SmallestQty * -1,
            SubTotal: creditNote.SubTotal * -1,
            UOM: creditNote.UOM,
            UnitPrice: creditNote.UnitPrice,
            Ctn: 0
          }

          if (tmp.ProjNo[0] == "L") {
            const regex = /(\d+)X[\d.]+L/g;
            let match;
            while ((match = regex.exec(tmp.Description)) !== null) {
              tmp.Ctn = tmp.Qty / parseInt(match[1]);
            }
          }

          this.invoiceDetails.push(tmp)
        });
      } catch (error) {
        console.error("Error fetching credit notes:", error);
      }

      // **Sort** invoiceDetails by ShipInfo, then DebtorName
      this.invoiceDetails.sort((a, b) => {
        if (a.ProjNo !== b.ProjNo) {
          return a.ProjNo.localeCompare(b.ProjNo);
        }
        if (a.DebtorName !== b.DebtorName) {
          return a.DebtorName.localeCompare(b.DebtorName);
        }
        return a.DocNo.localeCompare(b.DocNo);
      });

      this.calculateDocTotals();
      this.calculateDebtorTotals();
      this.calculateTotalsByShipInfo();
      this.calculateGrandTotal();

    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      this.isLoading = false;
    }
  }

  calculateTotalsByShipInfo(): void {
    this.shipInfoTotals = {};
    this.shipInfoQtyTotals = {};
    this.shipInfoLitreTotals = {};
    this.shipInfoLength = {};

    this.invoiceDetails.forEach(detail => {
      if (!this.shipInfoTotals[detail.ShipInfo]) {
        this.shipInfoLength[detail.ShipInfo] = 0;
        this.shipInfoTotals[detail.ShipInfo] = 0;
        this.shipInfoQtyTotals[detail.ShipInfo] = 0;
        this.shipInfoLitreTotals[detail.ShipInfo] = 0;
      }
      this.shipInfoLength[detail.ShipInfo]++;
      this.shipInfoTotals[detail.ShipInfo] += detail.SubTotal;
      this.shipInfoQtyTotals[detail.ShipInfo] += detail.Qty;
      this.shipInfoLitreTotals[detail.ShipInfo] += detail.SmallestQty;
    });
  }

  calculateDocTotals(): void {
    this.docSubTotals = {};
    this.docQtyTotals = {};
    this.docLitreTotals = {};
    this.docLength = {};

    this.invoiceDetails.forEach(detail => {
      if (!this.docSubTotals[detail.DocNo]) {
        this.docLength[detail.DocNo] = 0;
        this.docSubTotals[detail.DocNo] = 0;
        this.docQtyTotals[detail.DocNo] = 0;
        this.docLitreTotals[detail.DocNo] = 0;
      }
      this.docLength[detail.DocNo]++;
      this.docSubTotals[detail.DocNo] += detail.SubTotal;
      this.docLitreTotals[detail.DocNo] += detail.SmallestQty;
      this.docQtyTotals[detail.DocNo] += detail.Qty;
    });
  }

  calculateDebtorTotals() {
    this.debtorTotals = {};
    this.debtorLength = {};

    this.invoiceDetails.forEach((invoice) => {
      const debtorKey = `${invoice.DebtorName}-${invoice.ProjNo}`;

      if (!this.debtorTotals[debtorKey]) {
        this.debtorLength[debtorKey] = 0;

        this.debtorTotals[debtorKey] = {
          DebtorName: invoice.DebtorName,
          ShipInfo: invoice.ProjNo,
          SubTotal: 0,
          Qty: 0,
          Litres: 0,
        };
      }

      this.debtorLength[debtorKey]++;
      this.debtorTotals[debtorKey].SubTotal += invoice.SubTotal;
      this.debtorTotals[debtorKey].Qty += invoice.Qty;

      // Only add Litres if ShipInfo is 'LB'
      if (invoice.ShipInfo === 'LB') {
        this.debtorTotals[debtorKey].Litres += invoice.SmallestQty || 0;
      }
    });

    // console.log("Debtor Totals by ShipInfo:", this.debtorTotals);
    // console.log("Debtor Totals Length:", this.debtorLength);
  }

  calculateGrandTotal() {
    this.grandSubTotal = Object.values(this.shipInfoTotals).reduce((sum, value) => sum + value, 0);
    this.grandQtyTotal = Object.values(this.shipInfoQtyTotals).reduce((sum, value) => sum + value, 0);
  }

  getSelectedShipInfoText(): string {
    const selectedValues = this.shipInfo.value || [];

    const filteredValues = selectedValues.filter(value => value !== 'All');

    if (filteredValues.length === 0) {
      return 'None Selected';
    }

    return this.shipInfoList
      .filter(ship => filteredValues.includes(ship.id))
      .map(ship => ship.value)
      .join(', ');
  }


  toggleAllSelection(value: any) {
    if (value._selected) {
      this.shipInfo.setValue(this.shipInfoList.map(ship => ship.id));
      value._selected = true;
    }
    else {
      this.shipInfo.setValue([]);
    }
  }

  applyFilter() {
    if (!this.startDate || !this.endDate) {
      console.warn("Date range is required.");
      return;
    }

    if (this.shipInfo.value) {
      const start = moment(this.startDate).format("YYYY-MM-DD");
      const end = moment(this.endDate).format("YYYY-MM-DD");

      const index = this.shipInfo.value.indexOf("all");
      if (index > -1) {
        this.shipInfo.value.splice(index, 1);
      }

      if (this.shipInfo.value.includes('BA') && this.shipInfo.value.includes('BB')) {
        this.shipInfo.value.push('BA/BB');
      }

      const selectedShipInfo = this.shipInfo.value;

      this.isLoading = true;

      this.invoiceService.getFilteredInvoices(this.salesAgent, start, end, selectedShipInfo, this.isLensoDB)
        .subscribe(async (data) => {
          this.invoiceDetails = data;

          try {
            const creditNoteList = await lastValueFrom(
              this.invoiceService.getFilteredCreditNotes(this.salesAgent, start, end, selectedShipInfo, this.isLensoDB)
            );

            this.invoiceDetails.forEach((invoice) => {
              if (invoice.ProjNo[0] == "L") {
                const regex = /(\d+)X[\d.]+L/g;
                let match;
                while ((match = regex.exec(invoice.Description)) !== null) {
                  invoice.Ctn = invoice.Qty / parseInt(match[1]);
                }
              }
            });

            creditNoteList.forEach(creditNote => {
              let fullDebtorName = creditNote.DebtorName;
              if (creditNote.BranchCode) {
                fullDebtorName += ` [${creditNote.BranchCode.trim() ?? ''}]`;
              }

              const tmp = {
                DebtorName: fullDebtorName,
                Description: creditNote.Description,
                DocDate: creditNote.DocDate,
                DocNo: creditNote.DocNo,
                ItemCode: creditNote.ItemCode,
                Qty: creditNote.Qty * -1,
                ShipInfo: creditNote.ProjNo,
                ProjNo: creditNote.ProjNo,
                SmallestQty: creditNote.SmallestQty * -1,
                SubTotal: creditNote.SubTotal * -1,
                UOM: creditNote.UOM,
                UnitPrice: creditNote.UnitPrice,
                Ctn: 0
              }

              if (tmp.ProjNo[0] == "L") {
                const regex = /(\d+)X[\d.]+L/g;
                let match;
                while ((match = regex.exec(tmp.Description)) !== null) {
                  tmp.Ctn = tmp.Qty / parseInt(match[1]);
                }
              }

              this.invoiceDetails.push(tmp)
            });

          } catch (error) {
            console.error("Error fetching credit notes:", error);
          }

          // **Sort** invoiceDetails by ShipInfo, then DebtorName
          this.invoiceDetails.sort((a, b) => {
            if (a.ProjNo !== b.ProjNo) {
              return a.ProjNo.localeCompare(b.ProjNo);
            }
            if (a.DebtorName !== b.DebtorName) {
              return a.DebtorName.localeCompare(b.DebtorName);
            }
            return a.DocNo.localeCompare(b.DocNo);
          });

          this.calculateDocTotals();
          this.calculateDebtorTotals();
          this.calculateTotalsByShipInfo();
          this.calculateGrandTotal();

          this.isLoading = false;
        },
          (error) => {
            console.error("Error fetching filtered invoices:", error);
            this.isLoading = false;
          }
        );
    }
  }

  exportToPDF() {
    const doc = new jsPDF('landscape');
    const table = document.getElementById('invoiceTable');

    if (!table) {
      console.warn("Table not found!");
      return;
    }

    // Extract table headers manually
    const tableHeaders: string[] = [];
    const headerCells = table.querySelectorAll("thead tr th");
    headerCells.forEach((th: any) => tableHeaders.push(th.innerText));

    // Extract table rows manually
    const tableBody: any[] = [];
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row: any) => {
      var rowData: any[] = [];
      row.querySelectorAll("td").forEach((td: any) => {
        rowData.push(td.innerText)
      });

      if (rowData.length == 4) { //shipinfo total
        rowData.splice(1, 0, "", "", "", "");
        rowData = [
          { content: rowData[0], colSpan: 5, styles: { halign: "left", fontStyle: "bold" } },
          rowData[5], rowData[6], rowData[7]
        ];
      }
      else if (rowData.length == 5) { //debtor total
        rowData.splice(2, 0, "", "", "");
        rowData = [
          rowData[0],
          { content: rowData[1], colSpan: 4, styles: { halign: "left", fontStyle: "bold" } },
          rowData[5], rowData[6], rowData[7]
        ];
      }
      else if (rowData.length == 6) { //doc total
        rowData.splice(3, 0, "", "");
        rowData = [
          { content: rowData[0], colSpan: 2 },
          { content: rowData[2], colSpan: 3, styles: { halign: "left", fontStyle: "bold" } },
          rowData[5], rowData[6], rowData[7]
        ];
      }

      tableBody.push(rowData);
    });

    var footerData: any[] = ["Grand Total", "", "", "", "", this.grandQtyTotal.toString(), this.grandSubTotal.toFixed(2), ""];
    footerData = [
      { content: footerData[0], colSpan: 5, styles: { halign: "left", fontStyle: "bold" } },
      footerData[5], footerData[6], footerData[7]
    ];

    tableBody.push(footerData);

    // Generate the table
    autoTable(doc, {
      head: [tableHeaders], // Table headers
      body: tableBody, // Table data
      theme: 'grid' as ThemeType,
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { top: 10 },
      headStyles: { fillColor: [0, 92, 187], textColor: [255, 255, 255], fontStyle: 'bold' as 'bold' }, // Cast fontStyle
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
    });

    doc.save(`${this.salesAgent}_Sales_Report_${moment().format("DDMMYYYY")}.pdf`);
  }

  exportToExcel() {
    const table = document.getElementById('invoiceTable');

    if (!table) {
      console.warn("Table not found!");
      return;
    }

    const worksheet = XLSX.utils.table_to_sheet(table); // Converts table to worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelFile = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(excelFile, `${this.salesAgent}_Sales_Report_${moment().format("DDMMYYYY")}.xlsx`); // Downloads file
  }

  logout() {
    this.authService.logout(); // Call logout function from AuthService
    this.router.navigate(['/login']); // Redirect to login page
  }

  isNextDocNoSame(index: number): boolean {
    if (!this.invoiceDetails[index + 1]) {
      return false;
    }
    if (this.invoiceDetails[index]) {
      return this.invoiceDetails[index].DocNo == this.invoiceDetails[index + 1].DocNo;
    }
    return false;
  }

  isNextDebtorSame(index: number, isDocTotalRow: boolean, isDebtorTotalRow: boolean): boolean {
    if (!this.invoiceDetails[index + 1]) { // last row
      if (this.invoiceDetails[index - 1]) {
        if (!isDocTotalRow && !isDebtorTotalRow) {
          if (this.invoiceDetails[index].DocNo == this.invoiceDetails[index - 1].DocNo) {
            return true;
          }
        }
      }

      return false;
    }

    if (!isDocTotalRow && !isDebtorTotalRow) { // regular row
      if (this.invoiceDetails[index].DebtorName == this.invoiceDetails[index + 1].DebtorName && this.invoiceDetails[index].ProjNo == this.invoiceDetails[index + 1].ProjNo) {
        return true;
      }
      if (this.invoiceDetails[index - 1]) {
        if (this.invoiceDetails[index].DocNo == this.invoiceDetails[index - 1].DocNo) {
          return true;
        }
      }
    }
    else if (isDocTotalRow && !isDebtorTotalRow) { // doc total row
      if (this.invoiceDetails[index].DebtorName == this.invoiceDetails[index + 1].DebtorName && this.invoiceDetails[index].ProjNo == this.invoiceDetails[index + 1].ProjNo) {
        return true;
      }
    }
    else if (!isDocTotalRow && isDebtorTotalRow) { // debtor total row

    }
    return false;
  }

  isNextProjNoSame(index: number, isDocTotalRow: boolean, isDebtorTotalRow: boolean) {
    if (!this.invoiceDetails[index + 1]) { // last row
      if (!isDebtorTotalRow) {
        if (this.invoiceDetails[index - 1]) {
          if (this.invoiceDetails[index].DocNo != this.invoiceDetails[index - 1].DocNo && this.invoiceDetails[index].DebtorName != this.invoiceDetails[index - 1].DebtorName) {
            return false;
          }
          if (this.invoiceDetails[index].ProjNo == this.invoiceDetails[index - 1].ProjNo) {
            return true;
          }
        }
      }
      return false;
    }

    if (!isDocTotalRow && !isDebtorTotalRow) { // regular row
      if (this.invoiceDetails[index].ProjNo == this.invoiceDetails[index + 1].ProjNo) {
        return true;
      }
      if (this.invoiceDetails[index - 1]) {
        if ((this.invoiceDetails[index].DocNo == this.invoiceDetails[index - 1].DocNo)) {
          return true; // next entry is diff projNo and prev entry is same DocNo
        }
        if ((this.invoiceDetails[index].DebtorName == this.invoiceDetails[index - 1].DebtorName)) {
          return true; // next entry is diff projNo and prev entry is same debtor
        }
      }
    }
    else if (isDocTotalRow && !isDebtorTotalRow) { // doc total row
      if (this.invoiceDetails[index - 1]) {
        if ((this.invoiceDetails[index].ProjNo == this.invoiceDetails[index + 1].ProjNo)) {
          return true;
        }
        if (this.invoiceDetails[index].DebtorName == this.invoiceDetails[index - 1].DebtorName) {
          return true;
        }
      }
    }
    else if (!isDocTotalRow && isDebtorTotalRow) { // debtor total row
      if (this.invoiceDetails[index].ProjNo == this.invoiceDetails[index + 1].ProjNo) {
        return true;
      }
    }
    return false;
  }
}
