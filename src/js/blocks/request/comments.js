import React, { useMemo } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import useRequestQueries from "../../queries/requests";
import DataTable from 'react-data-table-component';

export default function Comments() {
    const {control,getValues,isDraft,formState:{errors}} = useFormContext();
    const reqId = getValues('reqId');
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Comment:</Form.Label>
                <Col md={9}>
                    <Controller
                        name="comment"
                        defaultValue=""
                        rules={{required:{value:true,message:'Comment is required'}}}
                        control={control}
                        render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief comment" rows={5} isInvalid={errors.comment}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.comment?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            {!isDraft && <CommentsHistory reqId={reqId}/>}
        </>
    );
}

function CommentsHistory({reqId}) {
    return (
        <section className="my-3">
            <header>
                <Row>
                    <Col><h3>Comment History</h3></Col>
                </Row>
            </header>
            <CommentsTable reqId={reqId}/>
        </section>
    );
}

function CommentsTable({reqId}) {
    const {getJournal} = useRequestQueries(reqId);
    const journal = getJournal();
    const columns = useMemo(() => [
        {name:'Date',selector:row=>row.JOURNAL_DATE},
        {name:'By',selector:row=>row.SUNY_ID},
        {name:'Comment',grow:3,selector:row=>row.COMMENTS,format:row=><pre className="m-0">{row.COMMENTS}</pre>}
    ],[journal.data]);
    return (
        <Row>
            <Col>
                <DataTable 
                    columns={columns} 
                    data={journal.data}
                    striped 
                    responsive
                    progressPending={journal.isLoading}
                />
            </Col>
        </Row>
    );
}

