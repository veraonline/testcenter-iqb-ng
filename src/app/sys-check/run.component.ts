import { SaveReportComponent } from './report/save-report/save-report.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { SyscheckDataService } from './syscheck-data.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService} from './backend.service';
import { MatStepper, MatStep } from '@angular/material';
import { UnitCheckComponent } from './unit-check/unit-check.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { map, skip, zip } from 'rxjs/operators';
import { StepperSelectionEvent } from '@angular/cdk/stepper';


@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.css']
})
export class RunComponent implements OnInit {
  @ViewChild('stepper', {static: true}) stepper: MatStepper;
  @ViewChild('stepEnv', {static: true}) stepEnv: MatStep;
  @ViewChild('stepNetwork', {static: true}) stepNetwork: MatStep;
  @ViewChild('compNetwork', {static: true}) compNetwork: NetworkCheckComponent;
  @ViewChild('stepUnit', {static: true}) stepUnit: MatStep;
  @ViewChild('compUnit', {static: true}) compUnit: UnitCheckComponent;

  paramId: string;
  unitcheckAvailable = false;
  questionnaireAvailable = false;
  saveEnabled = false;
  questionsonlymode = false;
  skipnetwork = false;
  pagetitle = 'IQB-Testcenter: System-Check';


  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private route: ActivatedRoute,
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.ds.networkData$.subscribe(nd => {
      if (typeof this.stepNetwork !== 'undefined') {
        this.stepNetwork.completed = nd.length > 0;
      }
    });

    this.stepper.linear = true;
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.paramId = params.get('c');
      if (this.paramId === this.bs.basicTestConfig.id) {
        this.ds.checkConfig$.next(this.bs.basicTestConfigData);
        this.stepper.selectedIndex = 0;
        if (typeof this.stepNetwork !== 'undefined') {
          this.stepNetwork.completed = false;
        }
        this.unitcheckAvailable = false;
        this.questionnaireAvailable = false;
        this.questionsonlymode = false;
        this.skipnetwork = false;
      } else {
        this.bs.getCheckConfigData(this.paramId).subscribe(
          scData => {
            scData.downloadGood = this.bs.basicTestConfigData.downloadGood;
            scData.downloadMinimum = this.bs.basicTestConfigData.downloadMinimum;
            scData.uploadGood = this.bs.basicTestConfigData.uploadGood;
            scData.uploadMinimum = this.bs.basicTestConfigData.uploadMinimum;
            scData.pingGood = this.bs.basicTestConfigData.pingGood;
            scData.pingMinimum = this.bs.basicTestConfigData.pingMinimum;

            if (typeof scData.ratings !== 'undefined') {
              for (let i = 0; i < scData.ratings.length; i++) {
                if (scData.ratings[i].type === 'download') {
                  scData.downloadGood = scData.ratings[i].good;
                  scData.downloadMinimum = scData.ratings[i].min;
                } else if (scData.ratings[i].type === 'upload') {
                  scData.uploadGood = scData.ratings[i].good;
                  scData.uploadMinimum = scData.ratings[i].min;
                } else if (scData.ratings[i].type === 'ping') {
                  scData.pingGood = scData.ratings[i].good;
                  scData.pingMinimum = scData.ratings[i].min;
                }
              }
            }

            this.ds.checkConfig$.next(scData);
            this.stepper.selectedIndex = 0;
            this.skipnetwork = scData.skipnetwork;
            if (typeof this.stepNetwork !== 'undefined') {
              this.stepNetwork.completed = this.skipnetwork;
            }
            this.saveEnabled = scData.cansave;
            this.questionsonlymode = scData.questionsonlymode;
            if (this.questionsonlymode) {
              // worst case: step is shown but no questions
              this.questionnaireAvailable = true;
              this.unitcheckAvailable = false;
            } else {
              this.questionnaireAvailable = scData.questions.length > 0;
              this.unitcheckAvailable = scData.hasunit;
            }
          }
        );
      }
    });



    this.stepper.animationDone
      .pipe(
        skip(1), // animationDone gets called when the the stepper is rendered the frist time on step 1, but not selectionChange
        zip(this.stepper.selectionChange),
        map((combined: [any, StepperSelectionEvent]) => combined[1])
      )
      .subscribe(stepEvent => {this.stepperSelectionChanged(stepEvent); });
  }

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  stepperSelectionChanged(e: StepperSelectionEvent) {
    this.ds.showNaviButtons$.next(false);

    if (e.selectedStep === this.stepUnit) {
      this.ds.showNaviButtons$.next(true);
      if (!this.stepUnit.completed) {
        const cd = this.ds.checkConfig$.getValue();
        this.compUnit.loadUnitandPlayer(cd.id);
        this.stepUnit.completed = true;
      }
    } else if (e.selectedStep === this.stepNetwork) {
      if (this.skipnetwork) {
        this.stepNetwork.completed = true;
      } else {
        if (!this.stepNetwork.completed) {
          this.compNetwork.startCheck();
        }
      }
    }
  }

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  saveReport() {
    const dialogRef = this.saveDialog.open(SaveReportComponent, {
      width: '500px',
      height: '600px',
      data: 'jojo'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== false) {
        const reportKey = result.get('key').value as string;
        const reportTitle = result.get('title').value as string;
        const cd = this.ds.checkConfig$.getValue();
        this.bs.saveReport(cd.id, reportKey, reportTitle,
          this.ds.environmentData$.getValue(),
          this.ds.networkData$.getValue(),
          this.ds.questionnaireData$.getValue()
        ).subscribe((saveOK: boolean) => {
          if (saveOK) {
            this.snackBar.open('Bericht gespeichert.', '', {duration: 3000});
          } else {
            this.snackBar.open('Konnte Bericht nicht speichern.', '', {duration: 3000});
          }
        });
      }
    });
  }


}
