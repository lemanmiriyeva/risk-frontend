"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

const C = {
    surface: '#FFFFFF',
    surfaceRaised: '#FBFAF6',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    goldTint: 'rgba(156,122,46,0.1)',
};

const gridSx = {
    border: `1px solid ${C.line}`,
    borderRadius: '10px',
    backgroundColor: C.surface,
    '& .MuiDataGrid-columnHeaders': {backgroundColor: C.surface, borderBottom: `1px solid ${C.lineStrong}`},
    '& .MuiDataGrid-columnHeaderTitle': {fontSize: 11, letterSpacing: '0.05em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500},
    '& .MuiDataGrid-cell': {borderBottom: `1px solid ${C.line}`, fontSize: 13.5, color: C.ink, display: 'flex', alignItems: 'center'},
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {outline: 'none'},
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {outline: 'none'},
    '& .MuiDataGrid-footerContainer': {borderTop: `1px solid ${C.line}`},
};

const fieldSx = {
    '& .MuiOutlinedInput-root': {borderRadius: '8px'},
};

const cardSx = {
    border: `1px solid ${C.line}`,
    borderRadius: '14px',
    backgroundColor: C.surface,
    boxShadow: '0 2px 12px rgba(29,27,22,0.04)',
};

function initials(title) {
    const parts = (title || '?').trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (title || '?').slice(0, 2).toUpperCase();
}

export default function OrganizationDetailsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const orgId = user?.organization?.id;

    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [shortName, setShortName] = useState('');
    const [authorizedName, setAuthorizedName] = useState('');
    const [authorizedPosition, setAuthorizedPosition] = useState('');

    const fetchOrg = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATION.LIST}${orgId}/`);
            setOrg(res.data);
            setTitle(res.data?.title || '');
            setShortName(res.data?.short_name || '');
            setAuthorizedName(res.data?.authorized_person_name || '');
            setAuthorizedPosition(res.data?.authorized_person_position || '');
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [orgId, enqueueSnackbar]);

    useEffect(() => {
        fetchOrg();
    }, [fetchOrg]);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATION.LIST}${orgId}/`, {
                title,
                short_name: shortName,
                authorized_person_name: authorizedName,
                authorized_person_position: authorizedPosition,
            });
            setOrg(res.data);
            enqueueSnackbar('Qurum məlumatları yeniləndi.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    const employeeColumns = useMemo(() => [
        {field: 'name', headerName: 'Ad Soyad', flex: 1.2, minWidth: 150},
        {field: 'email', headerName: 'Email', flex: 1.3, minWidth: 180},
        {
            field: 'role_name', headerName: 'Vəzifə', flex: 1, minWidth: 130,
            valueGetter: (value, row) => row?.role_name || '—',
        },
        {
            field: 'department_name', headerName: 'Departament', flex: 1, minWidth: 130,
            valueGetter: (value, row) => row?.department_name || '—',
        },
    ], []);

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
                <CircularProgress size={24}/>
            </Box>
        );
    }

    if (!org) {
        return (
            <Box sx={{py: 8, textAlign: 'center'}}>
                <Typography color="text.secondary">Qurum məlumatı tapılmadı.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
            {/* Başlıq kartı */}
            <Box sx={{...cardSx, p: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                <Avatar variant="rounded" sx={{width: 52, height: 52, borderRadius: '12px', backgroundColor: C.goldTint, color: C.gold, fontWeight: 700, fontSize: 18}}>
                    {initials(org.title)}
                </Avatar>
                <Box sx={{flex: 1, minWidth: 160}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>{org.title}</Typography>
                        <Chip
                            label={org.is_active ? 'Aktiv' : 'Deaktiv'} size="small"
                            sx={{
                                backgroundColor: org.is_active ? 'rgba(47,107,79,0.1)' : 'rgba(162,59,59,0.1)',
                                color: org.is_active ? '#2F6B4F' : '#A23B3B', fontWeight: 500,
                            }}
                        />
                    </Box>
                    {org.short_name && (
                        <Typography sx={{fontSize: 13, color: C.inkFaint, mt: 0.25}}>{org.short_name}</Typography>
                    )}
                </Box>

                <Box sx={{display: 'flex', gap: 2}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: '10px', backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}>
                        <PersonOutlineIcon sx={{color: C.gold, fontSize: 20}}/>
                        <Box>
                            <Typography sx={{fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1}}>{org.employee_count ?? 0}</Typography>
                            <Typography sx={{fontSize: 11, color: C.inkFaint}}>işçi</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '440px 1fr'}, gap: 3, alignItems: 'start'}}>
                {/* Redaktə forması */}
                <Box sx={{...cardSx, p: 3}}>
                    <Typography sx={{fontSize: 12, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2}}>
                        Qurum məlumatları
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <TextField
                            label="Qurumun adı" required fullWidth size="small" sx={fieldSx}
                            value={title} onChange={(e) => setTitle(e.target.value)}
                        />
                        <TextField
                            label="Qısaltma" fullWidth size="small" sx={fieldSx}
                            value={shortName} onChange={(e) => setShortName(e.target.value)}
                        />

                        <Box sx={{
                            mt: 0.5, p: 2, borderRadius: '10px', border: `1px solid ${C.line}`, backgroundColor: C.surfaceRaised,
                            display: 'flex', flexDirection: 'column', gap: 2,
                        }}>
                            <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.75}}>
                                <BadgeOutlinedIcon sx={{fontSize: 15}}/> Səlahiyyətli şəxs
                            </Typography>
                            <TextField
                                label="Adı Soyadı" required fullWidth size="small" sx={fieldSx}
                                value={authorizedName} onChange={(e) => setAuthorizedName(e.target.value)}
                            />
                            <TextField
                                label="Vəzifəsi" fullWidth size="small" sx={fieldSx}
                                value={authorizedPosition} onChange={(e) => setAuthorizedPosition(e.target.value)}
                            />
                        </Box>

                        <Typography sx={{fontSize: 12, color: C.inkFaint}}>
                            Qurumun aktiv/deaktiv statusunu yalnız sistem administratoru (root) dəyişə bilər.
                        </Typography>

                        <Box>
                            <Button
                                type="submit" variant="contained" disabled={saving}
                                sx={{backgroundColor: C.ink, color: '#fff', textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 3, '&:hover': {backgroundColor: C.gold}}}
                            >
                                {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Yadda saxla'}
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* İşçilər */}
                <Box sx={{...cardSx, p: 3}}>
                    <Typography sx={{fontSize: 12, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2}}>
                        İşçilər
                    </Typography>
                    <Box sx={{height: 440, width: '100%'}}>
                        <DataGrid
                            rows={org.employees || []}
                            columns={employeeColumns}
                            getRowId={(row) => row.id}
                            disableRowSelectionOnClick
                            disableColumnFilter
                            density="comfortable"
                            localeText={{noRowsLabel: 'İşçi tapılmadı'}}
                            sx={gridSx}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}