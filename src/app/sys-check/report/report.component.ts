import { BackendService } from '../backend.service';
import { SysCheckDataService } from '../sys-check-data.service';
import {Component, OnInit} from '@angular/core';
import { SaveReportComponent } from './save-report/save-report.component';
import { ReportEntry } from '../sys-check.interfaces';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CustomtextService} from "iqb-components";

@Component({
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css', '../sys-check.component.css']
})
export class ReportComponent implements OnInit {
  csvReport = '';
  saved = false;
  questionnaireDataWarnings: ReportEntry[] = [];

  constructor(
    private bs: BackendService,
    public ds: SysCheckDataService,
    public cts: CustomtextService,
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  saveReport() {
    const dialogRef = this.saveDialog.open(SaveReportComponent, {
      width: '500px',
      height: '600px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          const reportKey = result.get('key').value as string;
          const reportTitle = result.get('title').value as string;
          this.bs.saveReport(
            this.ds.checkConfig.workspaceId,
            this.ds.checkConfig.name,
              {
                keyPhrase: reportKey,
                title: reportTitle,
                environment: this.ds.environmentReport,
                network: this.ds.networkReport,
                questionnaire: this.ds.questionnaireReport,
                unit: []
              }
          ).subscribe((saveReportResult: boolean) => {
            if (saveReportResult) {
              this.snackBar.open('Bericht gespeichert.', '', {duration: 3000});
              this.saved = true;
            } else {
              this.snackBar.open('Konnte Bericht nicht speichern.', '', {duration: 3000});
            }
          });
        }
      }
    });
  }

  exportReport() {
    // TODO is there need for this?
    /*
    const stripQuotes = (string: String) => (string.toString() || '').replace(/[\\"]/g, '\\"');
    this.csvReport = this.ds.environmentData$.getValue()
      .concat(this.ds.networkData$.getValue())
      .concat(this.ds.questionnaireData$.getValue())
      .concat(this.ds.unitData$.getValue())
      .map((e: ReportEntry) => '"' + stripQuotes(e.label) + '", "' + stripQuotes(e.value) + '"')
      .join('\n');
     */
  }

  ngOnInit() {
    setTimeout(() => {
      this.ds.setNewCurrentStep('r');
      this.questionnaireDataWarnings = [];
      if (this.ds.checkConfig && this.ds.checkConfig.questions.length > 0) {
        if (this.ds.questionnaireReport.length > 0) {
          this.ds.questionnaireReport.forEach(re => {
            if (re.warning) {
              this.questionnaireDataWarnings.push(re);
            }
          });
        } else {
          this.questionnaireDataWarnings.push({
            id: 'tütü',
            type: 'yoyo',
            label: 'keine Antworten registriert',
            value: 'naja',
            warning: true
          });
        }
      }
    })
  }
}
