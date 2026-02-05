<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class PersonLookup extends HRForms2 {
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
        // Validation...
        //when GET and req[0] == bnumber there should be req[1] and match format of B#
        //when GET and req[0] == last_dob there should be req[1] and req[2] and req[2] format of yyyy-mon-dd?
        if ($this->method == "GET") {
            switch($this->req[0]) {
                case "bnumber":
                case "sunyid":
                    if (sizeof($this->req)!=2) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Invalid number of parameters"));
                    break;
                case "lastnamedob":
                    if (sizeof($this->req)!=3) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Invalid number of parameters"));
                    $d = date_parse_from_format('d-M-Y',$this->req[2]);
                    if (!$d || $d['error_count']!=0) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Invalid date format. Expected: DD-MON-YYYY"));
                    break;
                default:
                    $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Invalid lookup type"));
            }
        }
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "SELECT pers.hr_person_id, pemp.line_item_number, pers.suny_id, pers.nys_emplid, 
            nvl(pemp.employment_role_type, pers.role_type) as employment_role_type,
            nvl(pemp.data_status_emp, pers.role_status) as data_status_emp, pemp.status_type,
            nvl(pemp.appointment_effective_date, pers.role_effective_date) as appointment_effective_date,
            nvl(pemp.appointment_end_date, pers.role_end_date) as appointment_end_date,
            to_char(pers.birth_date,'DD-MON-YYYY') as birth_date, 
            nvl(pers.alias_first_name,pers.legal_first_name) as first_name,
            pers.legal_middle_name, pers.legal_last_name, pers.suffix_code, 
            pers.local_campus_id, pemp.payroll_agency_code, pemp.title_description, pemp.dpt_cmp_dsc,
            pemp.negotiating_unit, pemp.appointment_type, pemp.appointment_percent, pemp.pay_basis
            FROM buhr.buhr_person_mv@banner.cc.binghamton.edu pers
            LEFT JOIN (SELECT hr_person_id, payroll_agency_code, line_item_number, pay_basis,
                employment_role_type, data_status_emp, status_type, negotiating_unit,
                appointment_type, appointment_effective_date, appointment_end_date, appointment_percent,
                title_description, dpt_cmp_dsc
                FROM buhr.buhr_person_empl_mv@banner.cc.binghamton.edu) pemp on (pers.hr_person_id = pemp.hr_person_id)
            WHERE pers.role_type <> 'STSCH' ";
            //$qry = $base_qry;
        switch($this->req[0]) {
            case "bnumber":
                $qry .= "AND upper(pers.local_campus_id) = upper(:bnumber)";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":bnumber", $this->req[1]);
                break;
            case "lastnamedob":
                $qry .= "AND upper(pers.legal_last_name) = upper(:lastname) AND pers.birth_date = :dob";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":lastname", $this->req[1]);
                oci_bind_by_name($stmt,":dob", $this->req[2]);
                break;
            case "sunyid":
                $qry .= "AND upper(pers.suny_id) = upper(:suny_id)";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":suny_id", $this->req[1]);
                break;    
            default:
                //should not get here, just in case.
                $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Invalid lookup type"));
        }
        // Generate list of field names; used by JS to generate New Employee option
        oci_execute($stmt,OCI_DESCRIBE_ONLY);
        $ncols = oci_num_fields($stmt);
        for ($i = 1; $i <= $ncols; $i++) {
            $this->_arr['fields'][] = oci_field_name($stmt,$i);
        }
        // Get results
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $results = array();
        while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
            if ($row['EMPLOYMENT_ROLE_TYPE']=='VOLUN') $row['PAYROLL_AGENCY_CODE'] = "00000";
            $results[] = $row;
        }
        $this->nullToEmpty($results);
        if (!$results) $results = array(); // if no results build an empty array
        $this->_arr['results'] = $results;
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
}
