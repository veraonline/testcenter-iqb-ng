import { merge } from 'rxjs';
import { SyscheckDataService } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  reportEnabled = false;

  constructor(
    private ds: SyscheckDataService
  ) {
  }

  ngOnInit() {
    merge(
      this.ds.environmentData$,
      this.ds.networkData$,
      this.ds.questionnaireData$).subscribe(t => {
        this.updateReport();
      });

    this.ds.reportEnabled$.subscribe(is => this.reportEnabled = is);
  }

  updateReport() {

  }
}