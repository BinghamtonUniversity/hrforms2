import React, { useState, useEffect } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { useFormContext, Controller } from "react-hook-form";
import { useAppQueries } from "../../queries";
import useFormQueries from "../../queries/forms";
import useEmploymentQueries from "../../queries/employment";
import { Loading, DepartmentSelector } from "../components";
import { Icon } from "@iconify/react";
import DatePicker from "react-datepicker";

const name = 'employment.appointment';

export default function EmploymentAppointment() {
    const { control, getValues, setValue, hrPersonId, formState: { errors } } = useFormContext();

    const [showFac,setShowFac] = useState(true);

    const {getListData} = useAppQueries();
    const tenure = getListData('tenureStatus');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

/*    useEffect(() => {
        if (!apptinfo.data) return;
        if (getValues(`${name}.loadDate`)) return;
        setValue(`${name}.isFaculty`,(apptinfo.data?.DERIVED_FAC_TYPE=='Y')?'Yes':'No');
        if (apptinfo.data?.DERIVED_FAC_TYPE!='Y') setShowFac(false);
        setValue(`${name}.tenureStatus.id`,apptinfo.data?.TENURE_STATUS);
        setValue(`${name}.campusTitle`,apptinfo.data?.CAMPUS_TITLE);
        setValue(`${name}.department.id`,apptinfo.data?.REPORTING_DEPARTMENT_CODE);
        //NB: this doesn't work all the time, as suspected
        //setValue(`${name}.department.label`,document.querySelector(`[name="${name}.deartment.id"]`)?.selectedOptions?.item(0)?.label);
        setValue(`${name}.supervisor`,[{id:apptinfo.data?.SUPERVISOR_SUNY_ID,label:apptinfo.data?.SUPERVISOR_NAME}]);
        //missing: term_duration, notice_date,cont_perm_date,tenure_status
        setValue(`${name}.loadDate`,new Date());
    },[apptinfo.data]);*/
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Appointment Details</Col>
            </Row>
            {showFac &&
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
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Tenure Status:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.tenureStatus.id`}
                        control={control}
                        render={({field}) => (
                            <>
                                {tenure.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                {tenure.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                {tenure.data &&
                                    <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)}>
                                        <option></option>
                                        {tenure.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                    </Form.Control>
                                }
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Notice Date:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.noticeDate`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                isInvalid={errors.effDate}
                                autoComplete="off"
                            />}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Continuing/Permanency Date:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.contPermDate`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                isInvalid={errors.effDate}
                                autoComplete="off"
                            />}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Campus Title:</Form.Label>
                <Col xs={10} sm={9} md={8} lg={6} xl={5}>
                    <Controller
                        name={`${name}.campusTitle`}
                        control={control}
                        render={({field})=><Form.Control {...field} type="text"/>}
                    />
                </Col>
            </Form.Group>

            <AppointmentSupervisor/>

            <Form.Group as={Row}>
                <Form.Label column md={2}>Department:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.department.id`}
                        control={control}
                        defaultValue=""
                        render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)}/>}
                    />
                </Col>
            </Form.Group>
        </article>
    );
}
function AppointmentSupervisor() {
    const { control, getValues, setValue } = useFormContext();
    const [searchFilter,setSearchFilter] = useState('');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const handleSearch = query => setSearchFilter(query);
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${name}.supervisor[0].label`)) {
            setValue(`${name}.supervisor.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    useEffect(() => searchFilter&&supervisors.refetch(),[searchFilter]);
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Supervisor:</Form.Label>
            <Col xs={10} sm={8} md={6} lg={5} xl={4}>
                <Controller
                    name={`${name}.supervisor`}
                    control={control}
                    render={({field}) => <AsyncTypeahead
                        {...field}
                        filterBy={()=>true}
                        id="supervisor-search"
                        isLoading={supervisors.isLoading}
                        minLength={2}
                        flip={true} 
                        allowNew={true}
                        onSearch={handleSearch}
                        onBlur={e=>handleBlur(field,e)}
                        options={supervisors.data}
                        placeholder="Search for supervisor..."
                        selected={field.value||[]}
                    />}
                />
            </Col>
        </Form.Group>
    );
}
