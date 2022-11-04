import React, { useState, useEffect, lazy, useCallback, useMemo } from "react";
import { UserContext } from "../app";
import { useParams, useHistory, Prompt, Redirect, useLocation } from "react-router-dom";
import { currentUser, NotFound } from "../app";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal, Nav } from "react-bootstrap";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { AppButton, DateFormat } from "../blocks/components";
import get from "lodash/get";
import has from "lodash/has";
import zip from "lodash/zip";

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
        {value:'employment-appointment',label:'Appointment'},
        {value:'employment-leave',label:'Leave'},
        {value:'employment-pay',label:'Pay'},
        {value:'employment-position',label:'Position'},
        {value:'employment-salary',label:'Salary'},
        {value:'employment-separation',label:'Separation'},
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
    const qstr = new URLSearchParams(search);

    const [isBlocking,setIsBlocking] = useState(false);

    //TODO: probably need to change to useReducer
    const [tabList,setTabList] = useState(allTabs.filter(t=>t.value=='basic-info'));
    const [payTransTabs,setPayTransTabs] = useState();
    //const [tabList,setTabList] = useState(allTabs);

    const [activeTab,setActiveTab] = useState('basic-info');
    const [activeNav,setActiveNav] = useState('');

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
            info: {
                sunyId:"",
                bNumber:"",
                salutation:"",
                firstName:"",
                middleName:"",
                lastName:"",
                suffix:"",
                volFFEMT:"No",
                rehireRetiree:"No",
                retiredDate:"",
                retiredFrom:""
            },
            demographics: {
                DOB:"",
                citizen:"Yes",
                citizenType:"",
                empAuthCardOnly:"No",
                citizenCountry:"",
                visaType:"",
                gender:{id:"",value:""},
                militaryStatus:[],
                veteran:"No",
                protectedVetStatus:[''],
                militarySepDate:""                
            },
            directory: {
                address:[],
                phone:[],
                email:[]
            },
            education:[],
            contact:[]
        },
        employment: {
            position: {
                lineNumber:"",
                lineNumberDetails:{},
                apptType:"",
                apptPercent:"100",
                hasBenefits:false,
                benefitsFlag:"9",
                volReducton:"No",
                apptEndDate:"",
                checkSortCode:"",
                justification:""
            },
            appointment: {
                isFaculty:"No",
                campusTitle:"",
                supervisor:"",
                department:""
            },
            salary:{
                effDate:"",
                FTERate:"",
                "SUNYAccountsSplit":false,
                "SUNYAccounts": [
                    {
                        account:[{id:'',label:''}],
                        pct:'100'
                    }
                ],
                additionalSalary:[]
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
    }
    const testRecord = {
        formId:formId,
        lookup:{
            type:"lastNameDOB",
            values:{
                bNumber:"",
                lastName:"geiger",
                dob:new Date("8/31/1973"),
            },
        },
        selectedRow:{
            "HR_PERSON_ID": "0_65998_NR",
            "LINE_ITEM_NUMBER": "",
            "SUNY_ID": "51645",
            "NYS_EMPLID": "N01216708",
            "EMPLOYMENT_ROLE_TYPE": "New Role",
            "DATA_STATUS_EMP": "",
            "STATUS_TYPE": "",
            "APPOINTMENT_EFFECTIVE_DATE": "",
            "APPOINTMENT_END_DATE": null,
            "LEGAL_FIRST_NAME": "Scott",
            "LEGAL_MIDDLE_NAME": "T",
            "LEGAL_LAST_NAME": "Geiger",
            "LOCAL_CAMPUS_ID": "B00073866",
            "PAYROLL_AGENCY_CODE": "",
            "TITLE_DESCRIPTION": "",
            "DPT_CMP_DSC": ""
        },
        payroll:{code:"28020",title:"",description:""},
        effDate:new Date(),
        formCode:"EF",
        actionCode:"CCH",
        transactionCode:"AJT"
    }
    const methods = useForm({
        defaultValues: (qstr.has('test'))?testRecord:defaults
    });

    const watchFormActions = useWatch({name:['formActions.formCode','formActions.actionCode','formActions.transactionCode'],control:methods.control});

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
        }
    },[setTabList,allTabs]);

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
            <FormProvider {...methods} isDraft={isDraft} isNew={isNew} handleTabs={handleTabs}>
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
                                    {activeTab != 'basic-info' && <FormInfoBox/>}
                                    {(activeTab == 'employment-tab'&&['employment-appointment','employment-salary'].includes(activeNav)) && <EmploymentPositionInfoBox/>}
                                    <div className="px-2">
                                        <FormTabRouter tab={t.value} activeTab={activeTab} subTab={activeNav} setPayTransTabs={setPayTransTabs}/>
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
                <Col as="dd" sm={10} className="mb-0">{getValues('formId')}</Col>
                <Col as="dt" sm={2} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('payroll.title')}</Col>
                <Col as="dt" sm={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.info.sunyId')}</Col>
                <Col as="dt" sm={2} className="mb-0">Form Type:</Col>
                <Col as="dd" sm={4} className="mb-0"><FormTypeDisplay/></Col>
                <Col as="dt" sm={2} className="mb-0">B-Number:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.info.bNumber')}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0"><DateFormat>{getValues('effDate')}</DateFormat></Col>
                <Col as="dt" sm={2} className="mb-0">Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.info.firstName')} {getValues('person.info.lastName')}</Col>
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
    const name = 'employment.position.lineNumberDetails';
    const { control, getValues } = useFormContext();
    const watchApptPercent = useWatch({name:'employment.position.apptPercent',control:control});
    return (
        <Alert variant="secondary" className="mt-3">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Line Number:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.LINE_NUMBER`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Pay Basis:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.PAY_BASIS`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.PAYROLL`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Negotiating Unit:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.NEGOTIATING_UNIT`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0"><DateFormat nvl="Effective Date Not Set">{getValues(`${name}.EFFECTIVE_DATE}`)}</DateFormat></Col>
                <Col as="dt" sm={2} className="mb-0">Salary Grade:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.SALARY_GRADE`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Title:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.TITLE`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Segment Code:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.SEGMENT_CODE`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Department:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.POSITION_DEPARTMENT`)}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Percent:</Col>
                <Col as="dd" sm={4} className="mb-0">{watchApptPercent}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Status:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues(`${name}.POSITION_STATUS`)}</Col>
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