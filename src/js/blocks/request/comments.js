import React, { useMemo } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import useRequestQueries from "../../queries/requests";
import DataTable from 'react-data-table-component';
import { useSettingsContext, useAuthContext } from "../../app";
import { useRequestContext } from "../../config/request";
import { DescriptionPopover } from "../components";
import { orderBy } from "lodash";

export default function Comments() {
    const { control, getValues, formState:{ errors }} = useFormContext();
    const { reqId, canEdit, isDraft } = useRequestContext();
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Comment:</Form.Label>
                <Col md={9}>
                    <Controller
                        name="comment"
                        defaultValue=""
                        rules={{required:{value:canEdit&&getValues('action')!='save',message:'Comment is required'}}}
                        control={control}
                        render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief comment" rows={5} isInvalid={errors.comment} disabled={!canEdit}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.comment?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            {!isDraft && <CommentsHistory/>}
        </>
    );
}

function CommentsHistory() {
    return (
        <section className="my-3">
            <Row as="header">
                <Col as="h3">Comment History</Col>
            </Row>
            <CommentsTable/>
        </section>
    );
}

export function CommentsTable() {
    const { general } = useSettingsContext();
    const { isAdmin } = useAuthContext();
    const { reqId } = useRequestContext();
    const { getJournal } = useRequestQueries(reqId);
    
    const journal = getJournal({select:d=>{
        const skip = ['PA','PF'];
        if (general.showSkipped == 'N'||(!isAdmin && general.showSkipped=='A')) skip.push('X');
        return orderBy(d.filter(c=>{
            c.id = `${c.REQUEST_ID}_${c.SEQUENCE}`;
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

