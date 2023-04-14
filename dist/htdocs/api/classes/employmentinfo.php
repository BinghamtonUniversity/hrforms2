<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class EmploymentInfo extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		//if (count($this->req) != 2) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		switch($this->req[1]) {
			case "appointment":
				$tenureStatus = (new listdata(array('tenureStatus'),false))->returnData;

				$qry = "select p.term_duration, p.notice_date, p.continuing_permanency_date, p.tenure_status,
					p.campus_title, s.*,
					p.reporting_department_code, p.derived_fac_type
				from buhr.buhr_persemp_mv@banner.cc.binghamton.edu p
				left join (select distinct suny_id as supervisor_suny_id, 
					legal_last_name || decode(suffix_code,null,'',' ' || suffix_code) || ', ' || nvl(alias_first_name,legal_first_name) || ' ' || substr(legal_middle_name,0,1) as supervisor_name
					from buhr.buhr_person_mv@banner.cc.binghamton.edu) s on (p.supervisor_suny_id = s.supervisor_suny_id)
				where p.hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);

				// Tenure Status
				$key = array_search($row['TENURE_STATUS'],array_column($tenureStatus,0));
				$row['TENURE_STATUS'] = array("id"=>$row['TENURE_STATUS'],"label"=>($key!==false)?$tenureStatus[$key][1]:"");

				// Reporting Department:
				if ($row['REPORTING_DEPARTMENT_CODE'] != '') {
					$deptOrgs = (new listdata(array('deptOrgs'),false))->returnData;
					$key = array_search($row['REPORTING_DEPARTMENT_CODE'],array_column($deptOrgs,'DEPARTMENT_CODE'));
					$row['REPORTING_DEPARTMENT_CODE'] = array("id"=>$row['REPORTING_DEPARTMENT_CODE'],"label"=>$deptOrgs[$key]['DEPARTMENT_NAME']);
				}

				// Supervisor:
				$row['supervisor'] = array(array("id"=>$row['SUPERVISOR_SUNY_ID'],"label"=>$row['SUPERVISOR_NAME']));

				$this->_arr = $this->null2Empty($row);
				oci_free_statement($stmt);

				break;
			case "studentinfo":
				//N.B. Needs new grant on STVCLAS
				//N.B. Must use SPRIDEN_ID for query; this is Banner Data keyed off SPRIDEN_ID.  May not exist in HR data
				$qry = "select spriden_pidm, spriden_id, shrlgpa_gpa, nvl(shrtckg_i_count,0) as incompletes,
						nvl(shrtckg_mg_count,0) as missing_grades,
						sgkclas.f_class_code@banner.cc.binghamton.edu(spriden_pidm,'GD','999999') as stvclas_code, stvclas_desc,
						nvl(shrevnt_even_code,'No Academic History') as acad_hist, stvresd_code, stvresd_desc, stvresd_in_state_ind
						from spriden@banner.cc.binghamton.edu 
						left join (select shrlgpa_pidm, shrlgpa_gpa from SHRLGPA@banner.cc.binghamton.edu where shrlgpa_gpa_type_ind = 'O' and shrlgpa_levl_code='GD') on (spriden_pidm = shrlgpa_pidm)
						left join (select shrtckg_pidm, count(*) as shrtckg_i_count
							from shrtckg@banner.cc.binghamton.edu 
							where shrtckg_grde_code_final = 'I'
							and shrtckg_seq_no = (select max(i2.shrtckg_seq_no) from SHRTCKG@banner.cc.binghamton.edu i2 where i2.shrtckg_pidm = shrtckg_pidm and i2.shrtckg_term_code = shrtckg_term_code and i2.shrtckg_tckn_seq_no = shrtckg_tckn_seq_no)
							group by shrtckg_pidm
						) i on (i.shrtckg_pidm = spriden_pidm)
						left join (select shrtckg_pidm, count(*) as shrtckg_mg_count
							from shrtckg@banner.cc.binghamton.edu 
							where shrtckg_grde_code_final = 'MG'
							and shrtckg_seq_no = (select max(i2.shrtckg_seq_no) from SHRTCKG@banner.cc.binghamton.edu i2 where i2.shrtckg_pidm = shrtckg_pidm and i2.shrtckg_term_code = shrtckg_term_code and i2.shrtckg_tckn_seq_no = shrtckg_tckn_seq_no)
							group by shrtckg_pidm
						) mg on (mg.shrtckg_pidm = spriden_pidm)
						left join (select stvclas_code, stvclas_desc from stvclas@banner.cc.binghamton.edu) on (stvclas_code = sgkclas.f_class_code@banner.cc.binghamton.edu(spriden_pidm,'GD','999999'))
						left join (select shrevnt_pidm, shrevnt_even_code from shrevnt@banner.cc.binghamton.edu where shrevnt_even_code = 'ABD') on (shrevnt_pidm = spriden_pidm)
						left join (select sgbstdn_pidm, stvresd_code, stvresd_desc, stvresd_in_state_ind
							from sgbstdn@banner.cc.binghamton.edu s1
							join (select stvresd_code, stvresd_desc, stvresd_in_state_ind from stvresd@banner.cc.binghamton.edu) on (sgbstdn_resd_code = stvresd_code)
							where sgbstdn_term_code_eff = (select max(sgbstdn_term_code_eff) from sgbstdn@banner.cc.binghamton.edu where sgbstdn_pidm = s1.sgbstdn_pidm)
							) on (sgbstdn_pidm = spriden_pidm)
						where spriden_id = :bnumber
						and spriden_change_ind is null
						and spriden_ntyp_code is null";
					$stmt = oci_parse($this->db,$qry);
					oci_bind_by_name($stmt,":bnumber", $this->req[0]);
					$r = oci_execute($stmt);
					if (!$r) $this->raiseError();
					$stuData = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
					$stuData['STVRESD_IN_STATE_DESC'] = ($stuData['STVRESD_IN_STATE_IND']=='I')?'In State':'Out of State';
					oci_free_statement($stmt);

					//N.B. Needs new grant on STVTERM
					$qry = "select s.sgbstdn_term_code_eff, t.stvterm_desc, prg.smrprle_program_desc, mjr.stvmajr_desc
						from sgbstdn@banner.cc.binghamton.edu s
						left join (select stvmajr_code, stvmajr_desc from stvmajr@banner.cc.binghamton.edu) mjr on (mjr.stvmajr_code = s.sgbstdn_majr_code_1)
						left join (select smrprle_program, smrprle_program_desc from smrprle@banner.cc.binghamton.edu) prg on (prg.smrprle_program = s.sgbstdn_program_1)
						join (select stvterm_code, stvterm_desc from stvterm@banner.cc.binghamton.edu) t on (t.stvterm_code = s.sgbstdn_term_code_eff)
						where s.sgbstdn_pidm = (select spriden_pidm from spriden@banner.cc.binghamton.edu where spriden_id = :bnumber and spriden_change_ind is null and rownum = 1)
						and s.sgbstdn_term_code_eff = (select max(s2.sgbstdn_term_code_eff) from sgbstdn@banner.cc.binghamton.edu s2 where s2.sgbstdn_pidm = s.sgbstdn_pidm)";
					$stmt = oci_parse($this->db,$qry);
					oci_bind_by_name($stmt,":bnumber", $this->req[0]);
					$r = oci_execute($stmt);
					if (!$r) $this->raiseError();
					$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
					oci_free_statement($stmt);
	
					$this->_arr = array_merge($stuData,$row);
					$this->_arr = $this->null2Empty($this->_arr);
					
				break;
			case "position":
				$appointmentTypes = (new listdata(array('appointmentTypes'),false))->returnData;
				$benefitCodes = (new listdata(array('benefitCodes'),false))->returnData;
				$checkSortCodes = (new listdata(array('checkSortCodes'),false))->returnData;

				$qry = "select p.line_item_number, p.payroll_agency_code, p.appointment_type, p.appointment_percent, p.benefit_flag,
					p.appointment_effective_date, p.appointment_end_date, e.voluntary_reduction, p.payroll_mail_drop_id
				from  BUHR.BUHR_PERSEMP_MV@banner.cc.binghamton.edu p
				left join (select hr_employment_status_id, voluntary_reduction from BUHR.BUHR_EMPL_STATUS_MV@banner.cc.binghamton.edu) e on (e.hr_employment_status_id = p.hr_employment_status_id)
				where hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);

				// Appointment Type:
				$key = array_search($row['APPOINTMENT_TYPE'],array_column($appointmentTypes,0));
				$row['APPOINTMENT_TYPE'] = array("id"=>$row['APPOINTMENT_TYPE'],"label"=>($key!==false)?$appointmentTypes[$key][1]:"");

				// hasBenefits:
				$payroll = (new codes(array('payroll',$row['PAYROLL_AGENCY_CODE']),false))->returnData[0];
				if ($payroll['ADDITIONAL_INFO']->hasBenefits) {
					$row['hasBenefits'] = true;
					$key = array_search($row['BENEFIT_FLAG'],array_column($benefitCodes,0));
					$row['BENEFIT_FLAG'] = array("id"=>$row['BENEFIT_FLAG'],"label"=>($key!==false)?$benefitCodes[$key][1]:"");
				} else {
					$row['hasBenefits'] = false;
					$row['BENEFIT_FLAG'] = array("id"=>$benefitcodes[0][0],"label"=>$benefitCodes[0][1]);
				}

				// Mail Drop ID (aka Check Sort Code):
				$key = array_search($row['PAYROLL_MAIL_DROP_ID'],array_column($checkSortCodes,0));
				$row['PAYROLL_MAIL_DROP_ID'] = array("id"=>$row['PAYROLL_MAIL_DROP_ID'],"label"=>($key!==false)?$checkSortCodes[$key][1]:"");

				// Line Item Details:
				$row['positionDetails'] = (new position(array($row['PAYROLL_AGENCY_CODE'],$row['LINE_ITEM_NUMBER']),false))->returnData;

				$this->_arr = $this->null2Empty($row);
				oci_free_statement($stmt);

				break;
			case "salary":
				$qry = "select p.suny_id, p.line_item_number, p.payroll_agency_code, 
				p.appointment_percent, p.appointment_effective_date, p.appointment_end_date
				from  BUHR.BUHR_PERSEMP_MV@banner.cc.binghamton.edu p
				where hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);

				// Line Item Details:
				$pos = (new position(array($row['PAYROLL_AGENCY_CODE'],$row['LINE_ITEM_NUMBER']),false))->returnData;
				$row = array_merge($row,$pos);

				if ($row['PAY_BASIS'] == 'FEE') {
					$qry = "select commitment_effective_date as rate_effective_date, commitment_rate as rate_amount, number_of_payments
						from buhr.buhr_commitment_mv@banner.cc.binghamton.edu 
						where data_status <> 'H'
						and suny_id = :suny_id
						and commitment_effective_date <= :effective_date
						order by commitment_effective_date desc";
				} else {
					$qry = "select salary_effective_date as rate_effective_date, fta_rate as rate_amount, 1 as number_of_payments
						from buhr.buhr_salary_mv@banner.cc.binghamton.edu
						where data_status <> 'H'
						and suny_id = :suny_id
						and salary_effective_date >= : effective_date
						order by salary_effective_date desc";
				}
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $row['SUNY_ID']);
				oci_bind_by_name($stmt,":effective_date", $row['EFFECTIVE_DATE']);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$pay = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
				$row = array_merge($row,$pay);

				//TODO: add suny account info
				$row['SUNY_ACCOUNTS'] = array();

				// Existing Additional Salary Data:
				$additionalSalaryTypes = (new listdata(array('additionalSalaryTypes'),false))->returnData;
				$qry = "select hr_additional_salary_id, addl_salary_earning_code, addl_salary_effective_date, addl_salary_end_date, addl_salary_amount
					from BUHR.BUHR_ADDITIONAL_SALARY_MV@banner.cc.binghamton.edu
					where nvl(addl_salary_end_date,sysdate) >= sysdate
					and suny_id = :suny_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $row['SUNY_ID']);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while($addSalary = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$key = array_search($addSalary['ADDL_SALARY_EARNING_CODE'],array_column($additionalSalaryTypes,0));
					$addSalary['ADDL_SALARY_EARNING_CODE'] = array("id"=>$addSalary['ADDL_SALARY_EARNING_CODE'],"label"=>($key!==false)?$additionalSalaryTypes[$key][1]:"");
					$row['EXISTING_ADDITIONAL_SALARY'][] = $addSalary;
				}

				// Split Assignment Data
				$deptOrgs = (new listdata(array('deptOrgs'),false))->returnData;
				$workAllocation = (new listdata(array('workAllocation'),false))->returnData;
				$qry = "select c.hr_commitment_id, c.commitment_primary_flag, c.commitment_stack_id, c.commitment_effective_date,
  							c.commitment_end_date, c.campus_title, c.reporting_department_code, c.supervisor_suny_id,
  							s.supervisor_name, c.work_allocation, nvl(c.work_percent,'0') as WORK_PERCENT, c.duties, c.create_date
  							from buhr_commitment_mv@banner.cc.binghamton.edu c
							left join (select distinct suny_id as supervisor_suny_id, 
							    legal_last_name || decode(suffix_code,null,'',' ' || suffix_code) || ', ' || nvl(alias_first_name,legal_first_name) || ' ' || substr(legal_middle_name,0,1) as supervisor_name
    							from buhr.buhr_person_mv@banner.cc.binghamton.edu) s on (c.supervisor_suny_id = s.supervisor_suny_id)
  							where suny_id = :suny_id
  							and payroll_agency_code = :payroll
  							and nvl(c.commitment_end_date,sysdate) >= sysdate
  							order by c.commitment_stack_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $row['SUNY_ID']);
				oci_bind_by_name($stmt,":payroll", $row['PAYROLL_AGENCY_CODE']);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while($splitAssignment = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$key = array_search($splitAssignment['REPORTING_DEPARTMENT_CODE'],array_column($deptOrgs,'DEPARTMENT_CODE'));
					$splitAssignment['REPORTING_DEPARTMENT_CODE'] = array("id"=>$splitAssignment['REPORTING_DEPARTMENT_CODE'],"label"=>$deptOrgs[$key]['DEPARTMENT_NAME']);
					$splitAssignment['supervisor'] = array(array("id"=>$splitAssignment['SUPERVISOR_SUNY_ID'],"label"=>$splitAssignment['SUPERVISOR_NAME']));
					$key2 = array_search($splitAssignment['WORK_ALLOCATION'],array_column($workAllocation,0));
					$splitAssignment['WORK_ALLOCATION'] = array("id"=>$splitAssignment['WORK_ALLOCATION'],"label"=>$workAllocation[$key2][1]);
					$row['SPLIT_ASSIGNMENTS'][] = $splitAssignment;
				}
				
				// Reduce data set
				$row = array_intersect_key($row,array(
					"SUNY_ID"=>"",
					"RATE_EFFECTIVE_DATE"=>"",
					"PAY_BASIS"=>"",
					"APPOINTMENT_PERCENT"=>"",
					"RATE_AMOUNT"=>"",
					"NUMBER_OF_PAYMENTS"=>"",
					"SUNY_ACCOUNTS"=>array(),
					"ADDITIONAL_SALARY"=>array(),
					"EXISTING_ADDITIONAL_SALARY"=>array(),
					"SPLIT_ASSIGNMENTS"=>array()
				));

				$this->_arr = $this->null2Empty($row);
				oci_free_statement($stmt);
				break;
			case "leave": //needs SUNY_ID and EFFECTIVE_DATE
				$qry = "select pay_basis from buhr.buhr_persemp_mv@banner.cc.binghamton.edu 
					where hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
				oci_free_statement($stmt);
				if (in_array($row['PAY_BASIS'],array('BIW','FEE','HRY'))) break;
				//
				$qry = "select salary_effective_date, calculated_annual
					from BUHR.BUHR_SALARY_MV@banner.cc.binghamton.edu
					where data_status <> 'H' and suny_id = :suny_id 
					and salary_effective_date <= to_date(:eff_date,'yyyymmdd')
					order by salary_effective_date desc";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				oci_bind_by_name($stmt,":eff_date", $this->req[2]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
				$this->_arr = $this->null2Empty($row);
				break;
			case "pay": // needs SUNY_ID and Payroll Code
				$accounts = (new listdata(array('accounts'),false))->returnData;
				$qry = "select c.hr_commitment_id, c.commitment_effective_date, c.commitment_end_date,
					c.account_number, c.commitment_rate, c.student_award_amount, 
					c.reporting_department_code, c.reporting_department_name,
					c.supervisor_suny_id, s.first_name as supervisor_first_name, s.legal_last_name as supervisor_legal_last_name, s.legal_middle_name as supervisor_legal_middle_name,
					c.duties
					from BUHR.BUHR_COMMITMENT_MV@banner.cc.binghamton.edu c
					left join(select suny_id, nvl(alias_first_name,legal_first_name) as first_name, legal_last_name, legal_middle_name
					from buhr.buhr_person_mv@banner.cc.binghamton.edu) s on (s.suny_id = c.supervisor_suny_id)
					where data_status = 'C'
					and nvl(commitment_end_date,sysdate) >= sysdate
					and c.suny_id = :suny_id
					and c.payroll_agency_code = :payroll
					and c.commitment_rate > 0";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				oci_bind_by_name($stmt,":payroll", $this->req[2]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$key = array_search(row['ACCOUNT_NUMBER'],array_column($accounts,'ACCOUNT_CODE'));
					$row['ACCOUNT_NUMBER'] = $accounts[$key];
					$this->_arr[] = $row;
				};
				$this->_arr = $this->null2Empty($this->_arr);
				break;				
			case "volunteer"://needs suny_id and effective date
				$qry = "select 1 from dual";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
				break;

		}
        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
