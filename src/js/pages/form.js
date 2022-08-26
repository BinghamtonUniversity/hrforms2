import React, { useState, useEffect, lazy } from "react";
import { UserContext } from "../app";
import { useParams, useHistory, Prompt, Redirect, useLocation } from "react-router-dom";
import { currentUser, NotFound } from "../app";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal, Nav } from "react-bootstrap";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { AppButton, DateFormat } from "../blocks/components";

/* TABS */
const BasicInfo = lazy(()=>import("../blocks/form/basic_info"));
const PersonInfo = lazy(()=>import("../blocks/form/person-info"));
const PersonDemographics = lazy(()=>import("../blocks/form/person-demographics"));
const PersonDirectory = lazy(()=>import("../blocks/form/person-directory"));
const PersonEducation = lazy(()=>import("../blocks/form/person-education"));
const PersonContacts = lazy(()=>import("../blocks/form/person-contacts"));
const EmploymentPosition = lazy(()=>import("../blocks/form/employment-position"));
const EmploymentAppointment = lazy(()=>import("../blocks/form/employment-appointment"));

const allTabs = [
    {id:'basic-info',title:'Basic Info'},
    {id:'person-tab',title:'Person Info',subTabs:[
        {id:'person-info',title:'Information'},
        {id:'person-demographics',title:'Demographics'},
        {id:'person-directory',title:'Directory'},
        {id:'person-education',title:'Education'},
        {id:'person-contacts',title:'Contacts'},
    ]},
    {id:'employment-tab',title:'Employment Info',subTabs:[
        {id:'employment-position',title:'Position'},
        {id:'employment-appointment',title:'Appointment'},
        {id:'employment-salary',title:'Salary'},
        {id:'employment-leave',title:'Leave'},
        {id:'employment-pay',title:'Pay'},
    ]},
    {id:'comments-tab',title:'Comments'},
    {id:'review-tab',title:'Review'}
];

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
        <FormWrapper formId={formId} isDraft={isDraft} isNew={isNew}/>
    );
}

function FormWrapper({formId,isDraft,isNew}) {
    const { search } = useLocation();
    const qstr = new URLSearchParams(search);

    const [isBlocking,setIsBlocking] = useState(false);
    const [basicInfoComplete,setBasicInfoComplete] = useState(false);

    //TODO: probably need to change to useReducer
    //const [tabList,setTabList] = useState(allTabs.filter(t=>t.id=='basic-info'));
    const [tabList,setTabList] = useState(allTabs);

    const [activeTab,setActiveTab] = useState('basic-info');
    const [activeNav,setActiveNav] = useState('');

    const defaults = {
        formId:formId,
        isDraft:isDraft,
        isNew:isNew,
        lookup:{
            type:"bNumber",
            values:{
                bNumber:"",
                lastName:"",
                dob:"",
            },
        },
        selectedRow:{},
        payroll:"",
        effDate:"",
        formCode:"",
        actionCode:"",
        transactionCode:"",
        basicInfoComplete: false,
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
                rehireRetiree:"No"
            },
            demographics: {
                DOB:"",
                citizen:"Yes",
                gender:{id:"",value:""},
                veteran:"No",
                military_status:["N"]
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
                lineNumberDetails:{}
            },
            appointment: {}
        }
    }
    const testRecord = {
        formId:formId,
        isDraft:isDraft,
        isNew:false, //isNew
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
        payroll:"28020",
        effDate:new Date(),
        formCode:"EF",
        actionCode:"CCH",
        transactionCode:"AJT",
        basicInfoComplete: true
    }
    const methods = useForm({
        defaultValues: (qstr.has('test'))?testRecord:defaults
    });

    const watchBasicInfoComplete = useWatch({name:'basicInfoComplete',control:methods.control});

    const navigate = tab => {
        //TODO: can we maintain last tab/sub-tab?  or should we use routing? so that it remembers when you switch
        const idx = tabList.findIndex(t=>t.id==tab);
        let aNav = '';
        if (Object.keys(tabList[idx]).includes('subTabs')) aNav = tabList[idx].subTabs[0].id;
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
            setActiveNav('person-info');

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
        //setBasicInfoComplete(false);
        setTabList(allTabs.filter(t=>t.id=='basic-info'));
    }
    const handleNext = () => {
        //should validate before
        console.debug('Basic Info Complete');
        methods.setValue('isNew',false);
        // get tabs and set...
        setTabList(allTabs);
        setActiveTab('person-tab');
        setActiveNav('person-info');
    }
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
            <FormProvider {...methods} isDraft={isDraft}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)} onReset={handleReset}>
                    <Tabs activeKey={activeTab} onSelect={navigate} id="hr-forms-tabs">
                        {tabList.map(t => (
                            <Tab key={t.id} eventKey={t.id} title={t.title}>
                                <Container as="section" className="px-0" fluid>
                                    {t.subTabs && 
                                        <Row as="header" className="border-bottom mb-3 ml-0">
                                            <Nav activeKey={activeNav} onSelect={navigate2}>
                                                {t.subTabs.map(s=>(
                                                    <Nav.Item key={s.id}>
                                                        {s.id==activeNav?
                                                            <p className="px-2 pt-2 pb-1 m-0 active">{s.title}</p>:
                                                            <Nav.Link eventKey={s.id} className="px-2 pt-2 pb-1">{s.title}</Nav.Link>
                                                        }
                                                    </Nav.Item>
                                                ))}
                                            </Nav>
                                        </Row>
                                    }
                                    {activeTab != 'basic-info' && <FormInfoBox/>}
                                    <div className="px-2">
                                        <FormTabRouter tab={t.id} activeTab={activeTab} subTab={activeNav} setTabList={setTabList}/>
                                    </div>
                                    <Row as="footer" className="mt-3">
                                        <Col className="button-group justify-content-end">
                                            <AppButton type="reset" format="delete" onClick={handleReset}>Discard</AppButton>
                                            <AppButton id="next" format="next" onClick={handleNext} disabled={!watchBasicInfoComplete}>Next</AppButton>
                                            <AppButton id="submit" type="submit" format="submit" disabled={!watchBasicInfoComplete}>Submit</AppButton>
                                            <AppButton id="submit" type="submit" format="submit">Test Submit</AppButton>
                                        </Col>
                                    </Row>
                                    <SubmitterInfoBox/>
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
        case "basic-info": return <BasicInfo/>;
        case "person-tab.person-info": return <PersonInfo/>;
        case "person-tab.person-demographics": return <PersonDemographics/>;
        case "person-tab.person-directory": return <PersonDirectory/>;
        case "person-tab.person-education": return <PersonEducation/>;
        case "person-tab.person-contacts": return <PersonContacts/>;
        case "employment-tab.employment-position": return <EmploymentPosition/>;
        case "employment-tab.employment-appointment": return <EmploymentAppointment/>;
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
                <Col as="dd" sm={4} className="mb-0">{getValues('payroll')}</Col>
                <Col as="dt" sm={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('person.info.sunyId')}</Col>
                <Col as="dt" sm={2} className="mb-0">Form Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{getValues('formCode')} - {getValues('actionCode')} - {getValues('transactionCode')}</Col>
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