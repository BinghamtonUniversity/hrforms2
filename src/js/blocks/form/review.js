import React, { useState, useEffect, lazy, useCallback } from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { Icon } from "@iconify/react";
import { AppButton, DateFormat, errorToast, ModalConfirm } from "../components";
import { EmploymentPositionInfoBox, FormTypeDisplay } from "../../pages/form";
import { useHRFormContext } from "../../config/form";
import { find, get, startCase } from "lodash";
import { useHistory, Redirect } from "react-router-dom";
import { ReviewUserInfo } from "../components";
import { lazyRetry, useSettingsContext, useUserContext } from "../../app";
import useFormQueries from "../../queries/forms";
import { toast } from "react-toastify";
import useUserQueries from "../../queries/users";
import { useQueryClient } from "react-query";

//lazy load sections
const ReviewPersonInformation = lazy(()=>lazyRetry(()=>import("./review/review-person-information")));
const ReviewPersonDemographics = lazy(()=>lazyRetry(()=>import("./review/review-person-demographics")));
const ReviewPersonDirectory = lazy(()=>lazyRetry(()=>import("./review/review-person-directory")));
const ReviewPersonEducation = lazy(()=>lazyRetry(()=>import("./review/review-person-education")));
const ReviewPersonContacts = lazy(()=>lazyRetry(()=>import("./review/review-person-contacts")));
//const ReviewEmploymentPosition = lazy(()=>lazyRetry(()=>import("./review/review-employment-position")));
const ReviewEmploymentAppointment = lazy(()=>lazyRetry(()=>import("./review/review-employment-appointment")));
const ReviewEmploymentSalary = lazy(()=>lazyRetry(()=>import("./review/review-employment-salary")));
const ReviewEmploymentSeparation = lazy(()=>lazyRetry(()=>import("./review/review-employment-separation")));
const ReviewEmploymentLeave = lazy(()=>lazyRetry(()=>import("./review/review-employment-leave")));
const ReviewEmploymentPay = lazy(()=>lazyRetry(()=>import("./review/review-employment-pay")));
const ReviewEmploymentVolunteer = lazy(()=>lazyRetry(()=>import("./review/review-employment-volunteer")));
const ReviewComments = lazy(()=>lazyRetry(()=>import("./review/review-comments")));
const ReviewSubmitterInfo = lazy(()=>lazyRetry(()=>import("./review/review-submitter")));

export default function Review({setShouldBlock}) {
    const [showReturn,setShowReturn] = useState(false);

    const { forms:settings } = useSettingsContext();
    const user = useUserContext();
    const { getUserGroups } = useUserQueries(user.SUNY_ID);
    const usergroups = getUserGroups();
    const { getValues, formState: { isValid, errors } } = useFormContext();
    const { journalStatus } = useHRFormContext();
    const history = useHistory();

    const canUnarchive = useCallback(() => {
        if (journalStatus != 'Z') return false;
        if (!get(settings,'permissions.unarchive',false)) return false; // unarchive is not enabled in settings
        if (!usergroups.isSuccess) return false;
        const unarchiveGroup = get(settings,'permissions.unarchive-group',undefined);
        const userGroups = usergroups.data.map(g=>g.GROUP_ID);
        if (!userGroups.includes(unarchiveGroup)) return false; // user is not in the unarchive group or group not set.
        return true;
    },[settings,usergroups,journalStatus]);

    const handleReturnToList = () => history.push(get(history.location,'state.from',''));

    useEffect(()=>{
        (journalStatus!='Z')?setShowReturn(false):setShowReturn(!!(get(history.location,'state.from','')));
    },[history,journalStatus]);
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
                <Col className={`button-group d-print-none ${showReturn?'justify-content-between':'justify-content-end'}`}>
                    {showReturn && <AppButton size="sm" format="previous" onClick={handleReturnToList}>Return</AppButton>}
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
            {canUnarchive() && <UnArchiveForm setShouldBlock={setShouldBlock}/>}
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

function UnArchiveForm({setShouldBlock}) {
    //TODO: add in checks for settings and group permissions
    const [showUnarchiveModal,setShowUnarchiveModal] = useState(false);
    const [redirect,setRedirect] = useState('');

    const { getValues } = useFormContext();
    const { SUNY_ID } = useUserContext();
    const queryclient = useQueryClient();

    const { deleteArchiveForm } = useFormQueries(getValues('formId'));
    const unarchive = deleteArchiveForm();

    const handleUnarchive = () => {
        setShowUnarchiveModal(false);
        toast.promise(new Promise((resolve,reject) => {
            unarchive.mutateAsync().then(() => {
                queryclient.refetchQueries([SUNY_ID,'counts']);
                queryclient.refetchQueries([SUNY_ID,'formlist','final']);
                if (typeof setShouldBlock == 'function') setShouldBlock(false); // disable the blocking on redirect
                setRedirect('/');
                resolve();
            }).catch(err=>reject(err));
        }),{
            pending:'Unarchiving...',
            success:'Form Unarchived Successfully',
            error:errorToast('Failed to Unarchive Form')
        });
    }

    const unarchiveButtons = {
        close: {title: 'Close', callback: () => setShowUnarchiveModal(false)},
        confirm: {title: 'Unarchive', callback: () => handleUnarchive()}
    }

    if (redirect) return <Redirect to={redirect}/>;
    return (
        <Row as="footer" className="mt-3">
            <Col className="button-group justify-content-end d-print-none">
                <AppButton format="unarchive" onClick={()=>setShowUnarchiveModal(true)}>
                    Un-Archive
                </AppButton>
            </Col>
            <ModalConfirm 
                show={showUnarchiveModal} 
                title="Confirm Un-Archive" 
                icon="mdi:alert"
                buttons={unarchiveButtons}
            >
                Are you sure you want to un-archive this Form? It will be moved back to the in-progress list.
            </ModalConfirm>
        </Row>
    );
}