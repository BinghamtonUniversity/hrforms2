import React, { useState, useEffect, useCallback } from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { Icon } from '@iconify/react';
import { AppButton, CurrencyFormat, DateFormat, errorToast, ModalConfirm } from "../components";
import { CommentsTable } from "./comments";
import { useRequestContext } from "../../config/request"
import useListsQueries from "../../queries/lists";
import { useHistory, Redirect } from "react-router-dom";
import get from "lodash/get";
import { ReviewUserInfo } from "../components";
import { useSettingsContext, useUserContext } from "../../app";
import { toast } from "react-toastify";
import useUserQueries from "../../queries/users";
import useRequestQueries from "../../queries/requests";
import { useQueryClient } from "react-query";

function NewLine({gap}) { 
    let c = 'w-100';
    if (gap != undefined) c += ` mt-${gap}`;
    return (<div className={c}></div>); 
}

export default function Review({setShouldBlock}) {
    const [showReturn,setShowReturn] = useState(false);

    const { requests:settings } = useSettingsContext();
    const user = useUserContext();
    const { getUserGroups } = useUserQueries(user.SUNY_ID);
    const usergroups = getUserGroups();
    const { getValues } = useFormContext();
    const formValues = getValues();
    const { isDraft, isNew, journalStatus } = useRequestContext();

    const { getListData } = useListsQueries();
    const apptperiods = getListData('appointmentPeriods');
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
    },[history]);

    return (
        <article id="request-review">
            <Row>
                <Col className={`button-group d-print-none ${showReturn?'justify-content-between':'justify-content-end'}`}>
                    {showReturn && <AppButton size="sm" format="previous" onClick={handleReturnToList}>Return</AppButton>}
                    <AppButton format="print" title="Print Page" onClick={()=>window.print()}></AppButton>
                </Col>
            </Row>

            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4 className="border-bottom border-main">Position Request Information</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={3} md={2} className="mb-0">Request ID:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.reqId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Effective Date:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{formValues.effDate}</DateFormat></Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Position Type:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.posType.id} - {formValues.posType.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Request Type:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.reqType.id} - {formValues.reqType.title} </Col>
                    {formValues.reqType.id == 'N' &&
                        <>
                            <Col as="dt" sm={3} md={2} className="mb-0">New Position Funding:</Col>
                            <Col as="dd" sm={9} md={4} className="mb-0">{formValues.newFunding.title}</Col>
                            {['PC','PROV'].includes(formValues.newFunding.id) &&
                                <>
                                    <Col as="dt" sm={3} md={2} className="mb-0">Strata Committment ID:</Col>
                                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.commitmentId}</Col>
                                </>
                            }
                        </>
                    }
                    {formValues.reqType.id == 'F' &&
                        <>
                            <Col as="dt" sm={3} md={2} className="mb-0">Current Employee:</Col>
                            <Col as="dd" sm={9} md={4} className="mb-0">{formValues.currentEmployee[0]?.label}</Col>
                        </>
                    }
                    <NewLine/>
                    <Col as="dt" sm={3} md={2} className="mb-0">Candidate Name:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.candidateName}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">B-Number:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.bNumber}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Job Description:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0"><pre>{formValues.jobDesc}</pre></Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4 className="border-bottom border-main">Position Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={3} md={2} className="mb-0">Line Number:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{formValues.lineNumber}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Multiple Duplicate Lines:</Col>
                    <Col as="dd" sm={9} md={(formValues.multiLines=='Y')?4:10} className="mb-0">{formValues.multiLines}</Col>
                    {formValues.multiLines == 'Y' &&
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Number Of Lines:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{formValues.numLines}</Col>
                    </>
                    }
                    <Col as="dt" sm={3} md={2} className="mb-0">Requested Salary:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0"><CurrencyFormat>{formValues.minSalary}</CurrencyFormat> - <CurrencyFormat>{formValues.maxSalary}</CurrencyFormat></Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">FTE:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.fte}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Pay Basis:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{formValues.payBasis.id} - {formValues.payBasis.title}</Col>
                    {formValues.posType.id == 'C' && 
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Current Salary Grade:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{formValues.currentGrade}</Col>
                        <Col as="dt" sm={3} md={2} className="mb-0">New Salary Grade:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{formValues.newGrade}</Col>
                    </>
                    }
                    <Col as="dt" sm={3} md={2} className="mb-0">Requested Budget Title:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{formValues.reqBudgetTitle.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Appointment Status:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.apptStatus.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Appointment Duration:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.apptDuration} {apptperiods.data&&apptperiods.data.find(a=>a[0]==formValues.apptPeriod)?.at(1)}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Tentative End Date:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{formValues.tentativeEndDate}</DateFormat></Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4 className="border-bottom border-main">Account Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    {formValues.posType.id == 'F' &&
                        <>
                            <Col as="dt" sm={3} md={2} className="mb-0">Expenditure Type:</Col>
                            <Col as="dd" sm={9} md={4} className="mb-0">{formValues.expType}</Col>
                        </>
                    }
                    <Col as="dt" sm={3} md={2} className="mb-0">Org Name:</Col>
                    <Col as="dd" sm={9} md={(formValues.posType.id == 'F')?4:10} className="mb-0">{formValues.orgName?.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">SUNY Account:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">
                        {formValues.SUNYAccounts.map((a,i)=><p className="m-0" key={i}>{a.account[0]?.label} ({a.pct}%)</p>)}
                    </Col>
                </Row>
            </section>
            <section className="mb-4">
                <Row as="header">
                    <Col>
                        <h4 className="border-bottom border-main">Comments</h4>
                    </Col>
                </Row>
                <article>
                    <Row className="mb-0">
                        <Col md={12} className="mb-0">
                            <pre>{formValues.comment}</pre>
                        </Col>
                    </Row>
                </article>
                {!isDraft &&
                    <article className="mb-4">
                        <Row as="header">
                            <Col as="h5">History</Col>
                        </Row>
                        <CommentsTable reqId={formValues.reqId}/>
                    </article>
                }
            </section>
            <Row>
                <ReviewSubmitterInfo/>
                <ReviewUserInfo/>
            </Row>
            {canUnarchive() && <UnArchiveRequest setShouldBlock={setShouldBlock}/>}
        </article>
    );
}

function ReviewSubmitterInfo() {
    const { isDraft, createdBy } = useRequestContext();
    if (isDraft) return null;
    return (
        <section className="mb-4 col-sm-6">
            <Row as="header">
                <Col>
                    <h4 className="border-bottom border-main">Submitter Information</h4>
                </Col>
            </Row>
            {createdBy && 
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={3} md={2} className="mb-0">SUNY ID:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.SUNY_ID}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Name:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.fullName}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Email:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.EMAIL_ADDRESS_WORK}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Department:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.REPORTING_DEPARTMENT_NAME}</Col>
                </Row>
            }
        </section>
    );
}

function UnArchiveRequest({setShouldBlock}) {
    //TODO: add in checks for settings and group permissions
    const [showUnarchiveModal,setShowUnarchiveModal] = useState(false);
    const [redirect,setRedirect] = useState('');

    const { getValues } = useFormContext();
    const { SUNY_ID } = useUserContext();
    const queryclient = useQueryClient();

    const { deleteArchiveRequest } = useRequestQueries(getValues('reqId'));
    const unarchive = deleteArchiveRequest();

    const handleUnarchive = () => {
        setShowUnarchiveModal(false);
        toast.promise(new Promise((resolve,reject) => {
            unarchive.mutateAsync().then(() => {
                queryclient.refetchQueries([SUNY_ID,'counts']);
                queryclient.refetchQueries([SUNY_ID,'requestlist','final']);
                if (typeof setShouldBlock == 'function') setShouldBlock(false); // disable the blocking on redirect
                setRedirect('/');
                resolve();
            }).catch(err=>reject(err));
        }),{
            pending:'Unarchiving...',
            success:'Request Unarchived Successfully',
            error:errorToast('Failed to Unarchive Request')
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
                Are you sure you want to un-archive this Request? It will be moved back to the in-progress list.
            </ModalConfirm>
        </Row>
    );
}