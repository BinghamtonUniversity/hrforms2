import React, { useState, useEffect, lazy, useCallback, useMemo } from "react";
import { UserContext } from "../app";
import { useParams, useHistory, Prompt, Redirect, useLocation } from "react-router-dom";
import { currentUser, NotFound } from "../app";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal, Nav } from "react-bootstrap";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { AppButton, DateFormat } from "../blocks/components";
import { get, has, zip } from "lodash";
import usePersonQueries from "../queries/person";
import useEmploymentQueries from "../queries/employment";
import { isValid } from "date-fns";

/* TABS */
const BasicInfo = lazy(()=>import("../blocks/form/basic_info"));
const PersonInformation = lazy(()=>import("../blocks/form/person-information"));
const PersonDemographics = lazy(()=>import("../blocks/form/person-demographics"));
const PersonDirectory = lazy(()=>import("../blocks/form/person-directory"));
const PersonEducation = lazy(()=>import("../blocks/form/person-education"));
const PersonContacts = lazy(()=>import("../blocks/form/person-contacts"));
const EmploymentPosition = lazy(()=>import("../blocks/form/employment-position"));
const EmploymentAppointment = lazy(()=>import("../blocks/form/employment-appointment"));
const EmploymentSalary = lazy(()=>import("../blocks/form/employment-salary"));
const EmploymentSeparation = lazy(()=>import("../blocks/form/employment-separation"));
const EmploymentLeave = lazy(()=>import("../blocks/form/employment-leave"));
const EmploymentPay = lazy(()=>import("../blocks/form/employment-pay"));
const EmploymentVolunteer = lazy(()=>import("../blocks/form/employment-volunteer"));
const Comments = lazy(()=>import("../blocks/form/comments"));
const Review = lazy(()=>import("../blocks/form/review"));

const allTabs = [
    {value:'basic-info',label:'Basic Info'},
    {value:'person',label:'Person',children:[
        {value:'person-information',label:'Information'},
        {value:'person-demographics',label:'Demographics'},
        {value:'person-directory',label:'Directory'},
        {value:'person-education',label:'Education'},
        {value:'person-contacts',label:'Contacts'},
    ]},
    {value:'employment',label:'Employment',children:[
        {value:'employment-position',label:'Position'},
        {value:'employment-appointment',label:'Appointment'},
        {value:'employment-salary',label:'Salary'},
        {value:'employment-separation',label:'Separation'},
        {value:'employment-leave',label:'Leave'},
        {value:'employment-pay',label:'Pay'},
        {value:'employment-volunteer',label:'Volunteer'}
    ]},
    {value:'comments',label:'Comments'},
    {value:'review',label:'Review'}
];
export {allTabs}; //used on paytrans

const defaultFormActions = {
    paytransId:"",
    formCode:"",
    formCodes:[],
    formCodeDescription:"",
    actionCode:"",
    actionCodes:[],
    actionCodeDescription:"",
    transactionCode:"",
    transactionCodes:[],
    transactionCodeDescription:""
};
export {defaultFormActions}; //used on basic_info

export default function HRForm() {
    const [formId,setFormId] = useState('');
    const [isNew,setIsNew] = useState(false);
    const [isDraft,setIsDraft] = useState(false);

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = currentUser();

    useEffect(() => {
        if (!id) {
            setIsNew(true);
            setIsDraft(true);
            setFormId(`draft-${SUNY_ID}`);
        } else {
            setIsDraft((id=='draft'));
            setFormId((id=='draft')?`${id}-${sunyid}-${ts}`:id);
        }
    },[id,sunyid,ts]);
    if (!formId) return null;
    return(
        <FormWrapper formId={formId} isDraft={isDraft} isNew={isNew} setIsNew={setIsNew}/>
    );
}

function FormWrapper({formId,isDraft,isNew,setIsNew}) {
    const { search } = useLocation();
    //const qstr = new URLSearchParams(search);

    const [isBlocking,setIsBlocking] = useState(false);

    //TODO: probably need to change to useReducer?
    const [tabList,setTabList] = useState(allTabs.filter(t=>t.value=='basic-info'));

    const [activeTab,setActiveTab] = useState('basic-info');
    const [activeNav,setActiveNav] = useState('');
    const [showHidden,setShowHidden] = useState(true);

    const defaults = {
        formId:formId,
        lookup:{
            type:"bNumber",
            values:{
                bNumber:"",
                lastName:"",
                dob:"",
            },
        },
        selectedRow:{},
        payroll:{code:"",title:"",description:""},
        effDate:"",
        formActions:defaultFormActions,
        person: {
            information: {
                "HR_PERSON_ID":"",
                "SUNY_ID": "",
                "LOCAL_CAMPUS_ID": "",
                "FIRST_NAME": "",
                "LEGAL_MIDDLE_NAME": "",
                "LEGAL_LAST_NAME": "",
                "SUFFIX_CODE": "",
                "VOLUNTEER_FIRE_FLAG": "",
                "REHIRE_RETIREE": "",
                "RETIREMENT_DATE": "",
                "RETIRED_FROM": "",
                "salutation": {"id": "","label": ""}
            },
            demographics: {
                "BIRTH_DATE": "",
                "US_CITIZEN_INDICATOR": "Y",
                "NON_CITIZEN_TYPE": {"id": "","label": ""},
                "EMP_AUTHORIZE_CARD_INDICATOR": "",
                "VISA_CODE": {"id": "","label": ""},
                "CITIZENSHIP_COUNTRY_CODE": {"id": "","label": ""},
                "GENDER": {"id": "","label": ""},
                "HISPANIC_FLAG": "N",
                "ETHNICITY_MULT_CODES": "",
                "ETHNICITY_SOURCE_DSC": "",
                "DISABILITY_INDICATOR": "N",
                "MILITARY_STATUS_CODE": [],
                "VETERAN_INDICATOR": "N",
                "PROTECTED_VET_STATUS_CODE": [],
                "MILITARY_SEPARATION_DATE": "",
                "birthDate":"",
                "militarySepDate":""
            },
            directory: {
                address:[],
                phone:[],
                email:[]
            },
            education:{
                institutions:[]
            },
            contact:{
                contacts:[]
            }
        },
        employment: {
            position: {
                "LINE_ITEM_NUMBER": "",
                "APPOINTMENT_TYPE": {"id": "","label": ""},
                "APPOINTMENT_PERCENT": "",
                "BENEFIT_FLAG": {"id": "","label": ""},
                "APPOINTMENT_EFFECTIVE_DATE": "",
                "APPOINTMENT_END_DATE": "",
                "VOLUNTARY_REDUCTION": "",
                "PAYROLL_MAIL_DROP_ID": {"id": "","label": ""},
                "positionDetails": {},
                "apptEffDate": new Date(),
                "apptEndDate": new Date(),
                "hasBenefits": false,
                "justification": ""
            },
            appointment: {
                "TERM_DURATION": "",
                "NOTICE_DATE": "",
                "CONTINUING_PERMANENCY_DATE": "",
                "TENURE_STATUS": {"id": "", "label": ""},
                "CAMPUS_TITLE": "",
                "SUPERVISOR_SUNY_ID": "",
                "SUPERVISOR_NAME": "",
                "REPORTING_DEPARTMENT_CODE": {"id": "", "label": ""},
                "DERIVED_FAC_TYPE": "N",
                "supervisor": [],
                "noticeDate": "",
                "contPermDate": "",
                "facultyDetails": {
                    "fallCourses":{count:0,list:""},
                    "springCourses":{count:0,list:""}
                },
                "studentDetails": {
                    "fall":{
                        "tuition":"",
                        "credits":"0"
                    },
                    "spring":{
                        "tuition":"",
                        "credits":"0"
                    },
                    "fellowship":"N",
                    "fellowshipSource":{"id":"","label":""}
                }
            },
            salary:{
                "APPOINTMENT_PERCENT": "",
                "PAY_BASIS": "",
                "RATE_EFFECTIVE_DATE": "",
                "RATE_AMOUNT": "",
                "NUMBER_OF_PAYMENTS":"1",
                "SUNY_ACCOUNTS": [],
                "EXISTING_ADDITIONAL_SALARY": [],
                "ADDITIONAL_SALARY": [],
                "SPLIT_ASSIGNMENTS":[],
                "SUNYAccountsSplit":false,
                "SUNYAccounts": [
                    {
                        account:[{id:'',label:''}],
                        pct:'100'
                    }
                ],
                "totalSalary": ""
            },
            separation: {
                lastDateWorked:""
            },
            leave: {
                origSalary:"",
                leavePercent:0,
                leaveEndDate:"",
                justification:""
            },
            pay: []
        },
        comment:""
    };
    const methods = useForm({defaultValues: defaults});
    const watchFormActions = useWatch({name:['formActions.formCode','formActions.actionCode','formActions.transactionCode'],control:methods.control});
    const watchIds = useWatch({name:['person.information.HR_PERSON_ID','person.information.SUNY_ID','person.information.LOCAL_CAMPUS_ID'],control:methods.control});

    const {getPersonInfo} = usePersonQueries();
    const {getEmploymentInfo} = useEmploymentQueries();
    //TODO: only fetch if not saved; saved data comes HRF2 table.
    const personinfo = getPersonInfo(watchIds[0],'information',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const retireDate = new Date(d?.RETIREMENT_DATE);
            d.retireDate = isValid(retireDate)?retireDate:"";
            methods.setValue('person.information',Object.assign({},defaults.person.information,d));
        }
    });
    const persondemographics = getPersonInfo(watchIds[0],'demographics',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const birthDate = new Date(d?.BIRTH_DATE);
            d.birthDate = isValid(birthDate)?birthDate:"";
            const milSepDate = new Date(d?.MILITARY_SEPARATION_DATE);
            d.milSepDate = isValid(milSepDate)?milSepDate:"";
            methods.setValue('person.demographics',Object.assign({},defaults.person.demographics,d));
        }
    });
    const persondirectory = getPersonInfo(watchIds[0],'directory',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            Object.keys(d).forEach(k => {
                d[k].forEach(v => {
                    if (v.hasOwnProperty('CREATE_DATE')) {
                        const dt = new Date(v.CREATE_DATE);
                        v.effDate = isValid(dt)?dt:"";
                        v.createDate = isValid(dt)?dt:"";
                    }
                });
            });
            methods.setValue('person.directory',Object.assign({},defaults.person.directory,d));
        }
    });
    const personeducation = getPersonInfo(watchIds[0],'education',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(o => {
                const awardDate = new Date(o.DEGREE_YEAR,(o.DEGREE_MONTH||1)-1);
                o.awardDate = isValid(awardDate)?awardDate:"";
                o.institutionName = [{id:o.INSTITUTION_ID,label:o.INSTITUTION}];
                o.institutionCity = [o.INSTITUTION_CITY];
                const createDate = new Date(o.CREATE_DATE);
                o.createDate = isValid(createDate)?createDate:"";
            });
            methods.setValue('person.education.institutions',d);
        }
    });
    const personcontacts = getPersonInfo(watchIds[0],'contact',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(o => {
                o.isPrimary = (o.EMR_CTC_RANK=='1')?'Y':'N';
                const createDate = new Date(o.CREATE_DATE);
                o.createDate = isValid(createDate)?createDate:"";
            });
            methods.setValue('person.contact.contacts',d);
        }
    });
    const employmentappointment = getEmploymentInfo(watchIds[0],'appointment',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const noticeDate = new Date(d?.NOTICE_DATE);
            d.noticeDate = isValid(noticeDate)?noticeDate:"";
            const contPermDate = new Date(d?.CONTINUING_PERMANENCY_DATE);
            d.contPermDate = isValid(contPermDate)?contPermDate:"";
            methods.setValue('employment.appointment',Object.assign({},defaults.employment.appointment,d));
        }
    });
    const studentinformation = getEmploymentInfo(watchIds[2],'studentinfo',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            methods.setValue('employment.appointment.studentDetails',Object.assign({},defaults.employment.appointment.studentDetails,d));
        }
    });
    const employmentposition = getEmploymentInfo(watchIds[0],'position',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const apptEffDate = new Date(d?.APPOINTMENT_EFFECTIVE_DATE);
            d.apptEffDate = isValid(apptEffDate)?apptEffDate:"";
            const apptEndDate = new Date(d?.APPOINTMENT_END_DATE);
            d.apptEndDate = isValid(apptEndDate)?apptEndDate:"";
            methods.setValue('employment.position',Object.assign({},defaults.employment.position,d));
        }
    });
    const employmentsalary = getEmploymentInfo(watchIds[0],'salary',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const effDate = new Date(d?.RATE_EFFECTIVE_DATE);
            d.effDate = isValid(effDate)?effDate:methods.getValues('effDate');
            d.SPLIT_ASSIGNMENTS.map(a => {
                const commitmentEffDate = new Date(a?.COMMITMENT_EFFECTIVE_DATE);
                a.commitmentEffDate = isValid(commitmentEffDate)?commitmentEffDate:"";
                const commitmentEndDate = new Date(a?.COMMITMENT_END_DATE);
                a.commitmentEndDate = isValid(commitmentEndDate)?commitmentEndDate:"";
                const createDate = new Date(a?.CREATE_DATE);
                a.createDate = isValid(createDate)?createDate:"";
            });
            d.totalSalary = ((+d.RATE_AMOUNT*+d.NUMBER_OF_PAYMENTS) * (+d.APPOINTMENT_PERCENT/100)).toFixed(2);
            console.log(d);
            methods.setValue('employment.salary',Object.assign({},defaults.employment.salary,d));
        }
    });


    const navigate = tab => {
        //TODO: can we maintain last tab/sub-tab?  or should we use routing? so that it remembers when you switch
        const idx = tabList.findIndex(t=>t.value==tab);
        let aNav = '';
        if (Object.keys(tabList[idx]).includes('children')) aNav = tabList[idx].children[0].value;
        setIsNew(false);
        setActiveNav(aNav);
        setActiveTab(tab);
    }
    const navigate2 = nav => {
        setActiveNav(nav);
    }

    const handleSubmit = data => {
        console.debug(data);
        /*if (activeTab == 'basic-info') {
            console.debug('Basic Info Complete');
            methods.setValue('isNew',false);
            // get tabs and set...
            setTabList(allTabs);
            setActiveTab('person-tab');
            setActiveNav('person-information');

        }*/
    }
    const handleError = error => {
        console.log(error);
    }
    const handleReset = () => {
        console.warn('Resetting Form');
        /*
        // all queries used in the form need to be reset
        queryclient.resetQueries('personLookup');
        queryclient.resetQueries('paytrans');
        */
        methods.reset();
        setTabList(allTabs.filter(t=>t.value=='basic-info'));
    }
    const handleNext = () => {
        //should validate before
        console.log('find next tab/nav');
        const aTabIdx = tabList.findIndex(t=>t.value==activeTab);
        const tabListLen = tabList.length;
        const children = get(tabList,`${aTabIdx}.children`);
        const childrenLen = (children)?children.length:undefined;
        const aNavIdx = (children)?children.findIndex(t=>t.value==activeNav):undefined;
                    
        let nextNavIdx = (aNavIdx<childrenLen-1)?aNavIdx+1:aNavIdx;
        let nextTabIdx = (aNavIdx==childrenLen-1)?aTabIdx+1:aTabIdx;
        if (!children) nextTabIdx++;
        if (nextTabIdx != aTabIdx && has(tabList,`${nextTabIdx}.children`)) nextNavIdx = 0;
        if (nextTabIdx == tabListLen-1) nextTabIdx = aTabIdx; //don't allow tab index to exceed array length
        
        const nextTab = get(tabList,`${nextTabIdx}.value`);
        const nextNav = get(tabList,`${nextTabIdx}.children.${nextNavIdx}.value`);
        if (!nextTab) return;
        setActiveTab(nextTab);
        setActiveNav(nextNav);
    }

    const handleTabs = useCallback(tabs => {
        if (!tabs) {
            setTabList(allTabs.filter(t=>t.value=='basic-info'));
        } else {
            const tablist = [allTabs.find(t=>t.value=='basic-info')];
            ['person','employment'].forEach(t=>{
                if (tabs.filter(v=>v.startsWith(t)).length>0) {
                    const subTabs = allTabs.find(v=>v.value==t);
                    subTabs.children = subTabs.children.filter(s=>tabs.includes(s.value));
                    tablist.push(subTabs);
                }
            });
            tablist.push(...allTabs.filter(t=>['comments','review'].includes(t.value)));
            setTabList(tablist);
            if (!!watchIds[0]) { //get info for tabs
                console.log(watchIds[0]);
                // get value key from tablist and flatten
                const tabs = tablist.map(t=>(t.hasOwnProperty('children'))?t.children.map(c=>c.value):t.value).flat();
                //TODO: if saved form don't refetch, pull from saved data
                tabs.forEach(tab => {
                    switch(tab) {
                        case "person-information": personinfo.refetch(); break;
                        case "person-demographics": persondemographics.refetch(); break;
                        case "person-directory": persondirectory.refetch(); break;
                        case "person-education": personeducation.refetch(); break;
                        case "person-contacts": personcontacts.refetch(); break;
                        case "employment-appointment": employmentappointment.refetch(); break;
                        case "employment-position": 
                            employmentposition.refetch().then(() =>{
                                //if payroll == 28029 get student data
                                methods.getValues('payroll.code')=='28029' && studentinformation.refetch();
                            }); 
                            break;
                        case "employment-salary": employmentsalary.refetch(); break;
                        default:
                            console.log('TODO: Load Tab:',tab);
                    }
                });
            }
        }
    },[setTabList,allTabs,watchIds]);

    const testHighlight = useCallback(testCondition=>(testCondition)?'':'test-highlight',[]);
    const showInTest = useMemo(()=>watchFormActions[0]=='TEST'&&showHidden,[watchFormActions,showHidden]);

    return(
        <>
            <header>
                <Row>
                    <Col>
                        <h2>{isNew&&'New '}HR Form</h2>
                        <p>{formId}</p>
                    </Col>
                </Row>
            </header>
            <FormProvider {...methods} 
                isDraft={isDraft} 
                isNew={isNew} 
                isTest={methods.getValues('formActions.formCode')=='TEST'} 
                sunyId={methods.getValues('person.information.sunyId')} 
                hrPersonId={methods.getValues('person.information.hrPersonId')} 
                handleTabs={handleTabs}
                testHighlight={testHighlight}
                showInTest={showInTest}
            >
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)} onReset={handleReset}>
                    <Tabs activeKey={activeTab} onSelect={navigate} id="hr-forms-tabs">
                        {tabList.map(t => (
                            <Tab key={t.value} eventKey={t.value} title={t.label}>
                                <Container as="section" className="px-0" fluid>
                                    {t.children && 
                                        <Row as="header" className="border-bottom mb-3 ml-0">
                                            <Nav activeKey={activeNav} onSelect={navigate2}>
                                                {t.children.map(s=>(
                                                    <Nav.Item key={s.value}>
                                                        {s.value==activeNav?
                                                            <p className="px-2 pt-2 pb-1 m-0 active">{s.label}</p>:
                                                            <Nav.Link eventKey={s.value} className="px-2 pt-2 pb-1">{s.label}</Nav.Link>
                                                        }
                                                    </Nav.Item>
                                                ))}
                                            </Nav>
                                        </Row>
                                    }
                                    {!['basic-info','review'].includes(activeTab) && <FormInfoBox/>}
                                    {(activeTab == 'employment'&&['employment-appointment','employment-salary'].includes(activeNav)) && <EmploymentPositionInfoBox/>}
                                    <div className="px-2">
                                        <FormTabRouter tab={t.value} activeTab={activeTab} subTab={activeNav}/>
                                    </div>
                                    <Row as="footer" className="mt-3">
                                        <Col className="button-group justify-content-end">
                                            <AppButton type="reset" format="delete" onClick={handleReset}>Discard</AppButton>
                                            {(activeTab!='review')&&<AppButton id="next" format="next" onClick={handleNext} disabled={!watchFormActions.every(v=>!!v)}>Next</AppButton>}
                                            {(activeTab=='review')&&<AppButton id="submit" type="submit" format="submit" disabled={!watchFormActions.every(v=>!!v)}>Submit</AppButton>}
                                            <AppButton id="submit" type="submit" format="submit" variant="danger">Test Submit</AppButton>
                                        </Col>
                                    </Row>
                                    <SubmitterInfoBox/>
                                    <Row>
                                        <Col>
                                            <p>{activeTab}.{activeNav}</p>
                                        </Col>
                                        {methods.getValues('formActions.formCode')=='TEST' &&
                                            <Col className="d-flex justify-content-end">
                                                <Form.Check type="switch" id="showHiddenToggle" className="custom-switch-lg" label="Hide/Show Fields In Test Mode" checked={showHidden} onChange={()=>setShowHidden(!showHidden)}/>
                                            </Col>
                                        }
                                    </Row>
                                </Container>
                            </Tab>
                        ))}
                    </Tabs>
                </Form>
            </FormProvider>
        </>
    );
}

function FormTabRouter({tab,activeTab,subTab,...props}) {
    if (tab != activeTab) return null;
    const r = tab + ((subTab)?'.'+subTab:'');
    switch(r) {
        case "basic-info": return <BasicInfo setPayTransTabs={props.setPayTransTabs}/>;
        case "person.person-information": return <PersonInformation/>;
        case "person.person-demographics": return <PersonDemographics/>;
        case "person.person-directory": return <PersonDirectory/>;
        case "person.person-education": return <PersonEducation/>;
        case "person.person-contacts": return <PersonContacts/>;
        case "employment.employment-position": return <EmploymentPosition/>;
        case "employment.employment-appointment": return <EmploymentAppointment/>;
        case "employment.employment-salary": return <EmploymentSalary/>;
        case "employment.employment-separation": return <EmploymentSeparation/>;
        case "employment.employment-leave": return <EmploymentLeave/>;
        case "employment.employment-pay": return <EmploymentPay/>;
        case "employment.employment-volunteer": return <EmploymentVolunteer/>;
        case "comments": return <Comments/>;
        case "review": return <Review/>;
        default: return <p>Not Found</p>;
    }
}

function FormInfoBox () {
    const { getValues } = useFormContext();
    return (
        <Alert variant="secondary" className="mb-3">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Form ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('formId')}</Col>
                <Col as="dt" sm={2} className="mb-0">HR Person ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('selectedRow.HR_PERSON_ID')}</Col>
                <Col as="dt" sm={2} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('payroll.title')}</Col>
                <Col as="dt" sm={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('selectedRow.SUNY_ID')}</Col>
                <Col as="dt" sm={2} className="mb-0">Form Type:</Col>
                <Col as="dd" sm={4} className="mb-0"><FormTypeDisplay/></Col>
                <Col as="dt" sm={2} className="mb-0">B-Number:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.information.LOCAL_CAMPUS_ID')}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0"><DateFormat>{getValues('effDate')}</DateFormat></Col>
                <Col as="dt" sm={2} className="mb-0">Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.information.FIRST_NAME')} {getValues('person.information.LEGAL_LAST_NAME')} {getValues('person.information.SUFFIX_CODE')}</Col>
            </Row>
        </Alert>
    );
}
/*
Parameters:
    - variant=[null|code|title|both]
        - null|code: displays codes; e.g. 
                DF - - 
                EF - CCH - 641
        - title: displays titles; e.g. 
                Data Form - - 
                Employment Form - Concurrent Hire - S64.1C
        - both: displays [code]:title; e.g. 
                [DF]:Data Form - - 
                [EF]:Employment Form - [CCH]:Concurrent Hire - [641]:S64.1C
        - list: displays [codes] titles; e.g. 
                [DF//] Data Form - - 
                [EF/CCH/641] Employment Form - Concurrent Hire - S64.1C
    - separator: space padded character(s) to separate the elements
    - showNA: when set/true display 'N/A' if the value of the code is 'N/A' else display ''
*/
export function FormTypeDisplay({variant,separator,showNA}) {
    const { getValues } = useFormContext();
    const formActions = getValues('formActions');
    const display = useMemo(() => {
        const formCodesMap = new Map(formActions.formCodes);
        const actionCodesMap = new Map(formActions.actionCodes);
        const transactionCodesMap = new Map(formActions.transactionCodes);
        const sep = (separator)?` ${separator} `:' - ';
        const codes = [
            formActions.formCode,
            (formActions.actionCode=='N/A'&&!showNA)?'':formActions.actionCode,
            (formActions.transactionCode=='N/A'&&!showNA)?'':formActions.transactionCode
        ];
        const titles = [
            formCodesMap.get(formActions.formCode)?.at(0)||((formActions.formCode=='N/A'&&showNA)?'N/A':''),
            actionCodesMap.get(formActions.actionCode)?.at(0)||((formActions.actionCode=='N/A'&&showNA)?'N/A':''),
            transactionCodesMap.get(formActions.transactionCode)?.at(0)||((formActions.transactionCode=='N/A'&&showNA)?'N/A':'')
        ];
        switch(variant) {
            case "title":
                return titles.join(sep);
            case "both":
                const codeTitles = zip(codes,titles);
                return codeTitles.map(c=>{
                    if (!c[0]) return null;
                    if (c[0]=='N/A'&&showNA) return 'N/A';
                    return `[${c[0]}]:${c[1]}`;
                }).join(sep);
            case "list":
                return '['+codes.join('/')+'] '+titles.join(sep);
            default:
                return codes.join(sep);
        }
    },[variant,formActions,separator]);
    return <>{display}</>
}
export function EmploymentPositionInfoBox() {
    const { control, getValues } = useFormContext();
    const watchApptPercent = useWatch({name:'employment.position.APPOINTMENT_PERCENT',control:control});
    const positionDetails = getValues('employment.position.positionDetails');
    return (
        <Alert variant="secondary" className="mt-3">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Line Number:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.LINE_NUMBER}</Col>
                <Col as="dt" sm={2} className="mb-0">Pay Basis:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.PAY_BASIS}</Col>
                <Col as="dt" sm={2} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.PAYROLL}</Col>
                <Col as="dt" sm={2} className="mb-0">Negotiating Unit:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.NEGOTIATING_UNIT}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0"><DateFormat nvl="Effective Date Not Set">{positionDetails?.EFFECTIVE_DATE}</DateFormat></Col>
                <Col as="dt" sm={2} className="mb-0">Salary Grade:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.SALARY_GRADE}</Col>
                <Col as="dt" sm={2} className="mb-0">Title:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.TITLE}</Col>
                <Col as="dt" sm={2} className="mb-0">Segment Code:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.SEGMENT_CODE}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Department:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.POSITION_DEPARTMENT}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Percent:</Col>
                <Col as="dd" sm={4} className="mb-0">{watchApptPercent}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Status:</Col>
                <Col as="dd" sm={4} className="mb-0">{positionDetails?.POSITION_STATUS}</Col>
            </Row>
        </Alert>
    );
}
function SubmitterInfoBox() {
    return (
        <UserContext.Consumer>
            {({fullname,EMAIL_ADDRESS_WORK,REPORTING_DEPARTMENT_NAME}) => (
                <Alert variant="secondary" className="mt-3">
                    <Row as="dl" className="mb-0">
                        <Col as="dt" sm={2} className="mb-0">Name:</Col>
                        <Col as="dd" sm={10} className="mb-0">{fullname}</Col>
                        <Col as="dt" sm={2} className="mb-0">Email:</Col>
                        <Col as="dd" sm={10} className="mb-0">{EMAIL_ADDRESS_WORK}</Col>
                        <Col as="dt" sm={2} className="mb-0">Department:</Col>
                        <Col as="dd" sm={10} className="mb-0">{REPORTING_DEPARTMENT_NAME}</Col>
                    </Row>
                </Alert>
            )}
        </UserContext.Consumer>
    );
}