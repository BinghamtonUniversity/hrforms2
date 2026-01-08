import React, { useEffect, lazy } from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { Icon } from "@iconify/react";
import { AppButton, DateFormat } from "../components";
import { EmploymentPositionInfoBox, FormTypeDisplay } from "../../pages/form";
import { useHRFormContext } from "../../config/form";
import { find, get, startCase } from "lodash";
import useUserQueries from "../../queries/users";
import { useAuthContext } from "../../app";
import format from "date-fns/format";

//lazy load sections
const ReviewPersonInformation = lazy(()=>import("./review/review-person-information"));
const ReviewPersonDemographics = lazy(()=>import("./review/review-person-demographics"));
const ReviewPersonDirectory = lazy(()=>import("./review/review-person-directory"));
const ReviewPersonEducation = lazy(()=>import("./review/review-person-education"));
const ReviewPersonContacts = lazy(()=>import("./review/review-person-contacts"));
//const ReviewEmploymentPosition = lazy(()=>import("./review/review-employment-position"));
const ReviewEmploymentAppointment = lazy(()=>import("./review/review-employment-appointment"));
const ReviewEmploymentSalary = lazy(()=>import("./review/review-employment-salary"));
const ReviewEmploymentSeparation = lazy(()=>import("./review/review-employment-separation"));
const ReviewEmploymentLeave = lazy(()=>import("./review/review-employment-leave"));
const ReviewEmploymentPay = lazy(()=>import("./review/review-employment-pay"));
const ReviewEmploymentVolunteer = lazy(()=>import("./review/review-employment-volunteer"));
const ReviewComments = lazy(()=>import("./review/review-comments"));
const ReviewSubmitterInfo = lazy(()=>import("./review/review-submitter"));

export default function Review() {
    const { getValues, formState: { isValid, errors } } = useFormContext();
    const { journalStatus } = useHRFormContext();
    useEffect(()=>{
        console.debug('Review Form Data:',getValues());
        if (!isValid&&journalStatus!='Z') console.debug('%cForm Errors:%o',"background-color:#A00;font-weight:bold",errors);
    },[]);
    return (
        <article id="form-review" className="mt-3">
            {journalStatus!='Z' && 
                <Row as="header">
                    <Col as="h3">Review</Col>
                </Row>
            }
            <Row>
                <Col className="button-group justify-content-end d-print-none">
                    <AppButton format="print" title="Print Page" onClick={()=>window.print()}></AppButton>
                </Col>
            </Row>
            <ReviewFormData/>
            <ReviewSections/>
            <ReviewComments/>
            <Row>
                <ReviewSubmitterInfo/>
                <ReviewUserInfo/>
            </Row>
        </article>
    );
}

export function NewLine({gap}) { 
    let c = 'w-100';
    if (gap != undefined) c += ` mt-${gap}`;
    return (<div className={c}></div>); 
}

function ReviewFormData() {
    const { getValues } = useFormContext();
    const { isNew } = useHRFormContext(); //TODO:change isNew to isDraft?
    const [formId,payroll,effDate,PRRequired,PRNumber] = getValues(['formId','payroll','effDate','formActions.PR_REQUIRED','formActions.PR_NUMBER']);
    return (
        <section className="mb-4">
            <Row as="header">
                <Col>
                    <h4 className="border-bottom border-main">Form Data</h4>
                </Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} className="mb-0">Form ID:</Col>
                <Col as="dd" sm={9} className="mb-0">{formId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                <Col as="dt" sm={3} className="mb-0">Form Type:</Col>
                <Col as="dd" sm={9} className="mb-0"><FormTypeDisplay variant="both"/></Col>
                <Col as="dt" sm={3} className="mb-0">Payroll:</Col>
                <Col as="dd" sm={9} className="mb-0">{payroll?.title||payroll.PAYROLL_TITLE}</Col>
                <Col as="dt" sm={3} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={9} className="mb-0"><DateFormat>{effDate}</DateFormat></Col>
                {PRRequired=="1"&&
                    <>
                        <Col as="dt" sm={3} className="mb-0">Position Request #:</Col>
                        <Col as="dd" sm={9} className="mb-0">{PRNumber}</Col>
                    </>
                }
            </Row>
        </section>
    );
}

function ReviewSections() {
    const tabGroups = ['person','employment'];
    const { getValues } = useFormContext();
    const { tabs } = useHRFormContext();
    const payroll_code = getValues('payroll.PAYROLL_CODE');
    return (
        <>
            {tabGroups.map(tg => {
                const t = get(find(tabs,['value',tg]),'children',[]);
                if (t.length == 0) return null;
                //if tg == 'employment'
                return (
                    <section key={tg} className="mb-4">
                        <Row as="header">
                            <Col>
                                <h4 className="border-bottom border-main">{startCase(tg)} Data</h4>
                            </Col>
                        </Row>
                        {(tg == 'employment' && ['28020','28029'].includes(payroll_code)) && 
                            <article className="border border-dark rounded p-1 mb-2">
                                <Row as="header">
                                    <Col as="h5">Position</Col>
                                </Row>
                                <EmploymentPositionInfoBox/>
                            </article>
                        }
                        {t.map(s=><ReviewSectionRouter key={s.value} tab={s.value}/>)}
                    </section>
                );
            })}
        </>
    )
}

function ReviewSectionRouter({tab}) {
    switch(tab) {
        case "person-information": return <ReviewPersonInformation/>; break;
        case "person-demographics": return <ReviewPersonDemographics/>; break;
        case "person-directory": return <ReviewPersonDirectory/>; break;
        case "person-education": return <ReviewPersonEducation/>; break;
        case "person-contacts": return <ReviewPersonContacts/>; break;
        //case "employment-position": //position info is displayed by default
        case "employment-appointment": return <ReviewEmploymentAppointment/>; break;
        case "employment-salary": return <ReviewEmploymentSalary/>; break;
        case "employment-separation": return <ReviewEmploymentSeparation/>; break;
        case "employment-leave": return <ReviewEmploymentLeave/>; break;
        case "employment-pay": return <ReviewEmploymentPay/>; break;
        case "employment-volunteer": return <ReviewEmploymentVolunteer/>; break;
        default: return null;
    }
}

function ReviewUserInfo() { 
    const now = new Date();
    const { SUNY_ID } = useAuthContext();
    const { lookupUser } = useUserQueries(SUNY_ID);
    const [userData,setUserData] = React.useState({
        SUNY_ID: SUNY_ID,
        fullName: '',
        email: ''
    });
    const _ = lookupUser({onSuccess:d=>{
        if (d.length > 0) {
            const u = d[0];
            setUserData({
                SUNY_ID: u.SUNY_ID,
                fullName: u.fullName,
                email: u.email
            });
        }
    }});
    return (
        <section className="mb-4 col-sm-6">
            <Row as="header">
                <Col>
                    <h4 className="border-bottom border-main">User Information</h4>
                </Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} md={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" sm={9} md={10} className="mb-0">{userData.SUNY_ID}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Name:</Col>
                <Col as="dd" sm={9} md={10} className="mb-0">{userData.fullName}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Email:</Col>
                <Col as="dd" sm={9} md={10} className="mb-0">{userData.email}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Date:</Col>
                <Col as="dd" sm={9} md={10} className="mb-0">{format(now,'LLL d, yyyy h:mm a')}</Col>
            </Row>
        </section>
    );
}