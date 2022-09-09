import React, { useState, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { useFormContext, Controller } from "react-hook-form";
import { useAppQueries } from "../../queries";
import useFormQueries from "../../queries/forms";

const name = 'employment.appointment';

//TODO: faculty radio is hidden when person is not fac

export default function EmploymentAppointment() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Appointment Details</Col>
            </Row>
            <Form.Group as={Row}>
            <Form.Label column md={2}>Faculty:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name={`${name}.isFaculty`}
                        defaultValue={false}
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value="Yes" checked={field.value=='Yes'}/>
                                <Form.Check {...field} inline type="radio" label="No" value="No" checked={field.value=='No'}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Campus Title:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.campusTitle`}
                        control={control}
                        render={({field})=><Form.Control {...field} type="text"/>}
                    />
                </Col>
            </Form.Group>
            <AppointmentSupervisor/>
            <AppointmentDepartment/>
        </article>
    );
}
function AppointmentSupervisor() {
    const { control } = useFormContext();
    const [searchFilter,setSearchFilter] = useState('');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});
    const handleSearch = query => {
        setSearchFilter(query);
    }
    useEffect(() => {
        if (!searchFilter) return;
        supervisors.refetch();
    },[searchFilter]);
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Supervisor:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${name}.supervisor`}
                    defaultValue=""
                    control={control}
                    render={({field}) => <AsyncTypeahead
                        {...field}
                        filterBy={()=>true}
                        id="supervisor-search"
                        isLoading={supervisors.isLoading}
                        minLength={2}
                        flip={true} 
                        addNew={true}
                        onSearch={handleSearch}
                        options={supervisors.data}
                        placeholder="Search for supervisor..."
                    />}
                />
            </Col>
        </Form.Group>
    );
}
function AppointmentDepartment() {
    const { control } = useFormContext();
    const { getListData } = useAppQueries();
    const departments = getListData('deptOrgs');
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Department:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${name}.department`}
                    control={control}
                    defaultValue=""
                    render={({field}) => (
                        <Form.Control {...field} as="select">
                            <option></option>
                            {departments.data&&departments.data.map(d=><option key={d.DEPARTMENT_CODE} value={d.DEPARTMENT_CODE}>{d.DEPARTMENT_DESC}</option>)}
                        </Form.Control>
                    )}
                />
            </Col>
        </Form.Group>
    );
}