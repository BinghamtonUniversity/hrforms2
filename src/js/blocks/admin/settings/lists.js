import React from "react";
import { SettingsContext } from "../../../app";
import { useFormContext, Controller } from "react-hook-form";
import { Loading } from "../../components";
import { Form, Row, Col } from "react-bootstrap";
import { useAppQueries } from "../../../queries";
import { Alert } from "react-bootstrap";

export default function SettingsLists() {
    const {getLists} = useAppQueries();
    const listdata = getLists();

    if (listdata.isError) return <Loading type="alert" isError>Error Loading List Data</Loading>;
    if (listdata.isLoading) return <Loading type="alert">Loading List Data...</Loading>;
    return (
        <SettingsContext.Consumer>
            {({lists})=>(
                <>
                    <Row>
                        <Col>
                            <Alert variant="warning">Not currently being used</Alert>
                        </Col>
                    </Row>
                    <ListsComponent name="posTypesList" label="Position Types List" value={lists.posTypesList} data={listdata.data}/>
                    <ListsComponent name="reqTypesList" label="Request Types List" value={lists.reqTypesList} data={listdata.data}/>
                    <ListsComponent name="payBasisTypesList" label="Pay Basis Types List" value={lists.payBasisTypesList} data={listdata.data}/>
                    <ListsComponent name="apptTypesList" label="Appointment Types List" value={lists.apptTypesList} data={listdata.data}/>
                </>
            )}
        </SettingsContext.Consumer>
    );
}

function ListsComponent({label,name,value,data}) {
    const {control} = useFormContext();
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>{label}:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`lists.${name}`}
                    control={control}
                    render={({field}) => (
                        <Form.Control {...field} as="select">
                            <option></option>
                            {data.map(l=><option key={l.LIST_ID} value={l.LIST_ID}>{l.LIST_NAME}</option>)}
                        </Form.Control>
                    )}
                />
            </Col>
        </Form.Group>
    );
}
