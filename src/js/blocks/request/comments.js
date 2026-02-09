import React, { useMemo, useState } from "react";
import { Row, Col, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import useRequestQueries from "../../queries/requests";
import DataTable from 'react-data-table-component';
import { useSettingsContext, useAuthContext } from "../../app";
import { useRequestContext } from "../../config/request";
import { DescriptionPopover } from "../components";
import { orderBy } from "lodash";
import { get } from "lodash";
import { RequestFieldErrorMessage } from "../../pages/request";


export default function Comments() {
    const { control, getValues, formState:{ errors }} = useFormContext();
    const { canEdit, isDraft } = useRequestContext();
    return (
        <>
            <Form.Group as={Row} controlId="reqComment">
                <Form.Label column md={2}>Comment*:</Form.Label>
                <Col md={9}>
                    <Controller
                        name="comment"
                        defaultValue=""
                        rules={{required:{value:canEdit&&getValues('action')!='save',message:'Comment is required'}}}
                        control={control}
                        render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief comment" rows={5} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <RequestFieldErrorMessage fieldName="comment"/>
                </Col>
            </Form.Group>
            {!isDraft && <CommentsHistory/>}
        </>
    );
}

function CommentsHistory() {
    const { isAdmin } = useAuthContext();
    const [showSequence, setShowSequence] = useState(false);

    return (
        <section className="my-3">
            <Row as="header">
                <Col as="h3">Comment History</Col>
                <Col className="d-flex justify-content-end">
                    {isAdmin && <Form.Check 
                        type="switch"
                        id="show-sequence-switch"
                        label=<span>Show Sequence <small className="font-italic">(Admin Only)</small></span>
                        onChange={e=>setShowSequence(e.target.checked)}
                    />}
                </Col>
            </Row>
            <CommentsTable showSequence={showSequence}/>
        </section>
    );
}

export function CommentsTable({showSequence}) {
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
        {name:'Date',selector:row=>row.journalDateSort,sortable:true,format:row=><>{row.journalDateFmt}</>},
        {name:'Seq',selector:row=>row.SEQUENCE,width:'100px',omit:!showSequence},
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
        {name:'Comment',grow:3,selector:row=>row.COMMENTS,format:row=><pre className="m-0 py-2">{row.COMMENTS}</pre>}
    ],[journal.data,showSequence]);

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
                    defaultSortFieldId={1}
                    defaultSortAsc={false}
                />
            </Col>
        </Row>
    );
}

