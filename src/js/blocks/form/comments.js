import React, { useMemo, useRef, useEffect } from "react";
import { Row, Col, Form, OverlayTrigger, Tooltip  } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import { useHRFormContext } from "../../config/form";
import { useSettingsContext, useAuthContext } from "../../app";
import useFormQueries from "../../queries/forms";
import { DescriptionPopover } from "../components";
import DataTable from 'react-data-table-component';
import { get, orderBy } from "lodash";
import { FormFieldErrorMessage } from "../../pages/form";

export default function Comments() {
    const ref = useRef();
    const { control, getValues, formState:{ errors } } = useFormContext();
    const { isDraft, canEdit, activeNav } = useHRFormContext();
    const formId = getValues('formId');
    useEffect(()=>(canEdit&&ref.current)&&ref.current.focus(),[activeNav]);
    return (
        <article>
            {canEdit &&
                <section className="mt-3">
                    <Row as="header">
                        <Col as="h3">Comment</Col>
                    </Row>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Comment:</Form.Label>
                        <Col md={9}>
                            <Controller
                                name="comment"
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} as="textarea" ref={ref} rows={5} isInvalid={get(errors,'comment',false)}/>}
                            />
                            <FormFieldErrorMessage fieldName="comment"/>
                        </Col>
                    </Form.Group>
                </section>
            }
            {!isDraft && <CommentHistory formId={formId}/>}
        </article>
    );
}

function CommentHistory({formId}) {
    return (
        <section>
            <Row as="header">
                <Col as="h3">Comment History</Col>
            </Row>
            <CommentsTable formId={formId}/>
        </section>
    );
}

export function CommentsTable({formId}) {
    const { general } = useSettingsContext();
    const { isAdmin } = useAuthContext();
    const {getJournal} = useFormQueries(formId);
    
    const journal = getJournal({select:d=>{
        const skip = ['PA','PF'];
        if (general.showSkipped == 'N'||(!isAdmin && general.showSkipped=='A')) skip.push('X');
        return orderBy(d.filter(c=>{
            c.id = `${c.FORM_ID}_${c.SEQUENCE}`;
            return !skip.includes(c.STATUS);
        }),j=>parseInt(j.SEQUENCE),['desc']);
    }});

    const columns = useMemo(() => [
        {name:'Date',selector:row=>row.JOURNAL_DATE},
        {name:'Group',cell:row=>{
            let description = row.GROUP_TO_DESCRIPTION||<span className="font-italic">No Group Description</span>;
            let title = row.GROUP_TO_NAME;
            if (row.STATUS == 'S') {
                description = row.GROUP_FROM_DESCRIPTION;
                title = row.GROUP_FROM_NAME;
            }
            return (
                <span>
                    <DescriptionPopover
                        id={`${row.REQUEST_ID}_${row.SEQUENCE}`}
                        title={title}
                        placement="top"
                        flip
                        content={<p>{description}</p>}
                    >
                        <p className="my-1 text-pointer">{title}</p>
                    </DescriptionPopover>
                </span>
            );
        }},
        {name:'By',selector:row=>row.SUNY_ID,format:row=><>{row.fullName} ({row.SUNY_ID})</>},
        {name:'Status',selector:row=>(
            <OverlayTrigger placement="auto" overlay={
                <Tooltip id={`tooltip-status-${row.SEQUENCE}`}>{get(general.status,`${row.STATUS}.list`,'Unknown')}</Tooltip>
            }><span>{row.STATUS}</span></OverlayTrigger>
        ),width:'100px'},
        {name:'Comment',grow:3,selector:row=>row.COMMENTS,format:row=><pre className="m-0">{row.COMMENTS}</pre>}
    ],[journal.data]);

    const conditionalRowStyles = [
        {
            when: row => row.STATUS === 'X',
            classNames: ['badge-white-striped']
        }
    ];
    return (
        <Row>
            <Col>
                <DataTable 
                    keyField="id"
                    columns={columns} 
                    data={journal.data}
                    striped 
                    responsive
                    progressPending={journal.isLoading}
                    conditionalRowStyles={conditionalRowStyles}
                />
            </Col>
        </Row>
    );
}
