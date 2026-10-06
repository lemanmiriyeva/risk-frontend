"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, fieldSx, normalizeList, pageWrapSx, panelSx, primaryButtonSx, softButtonSx,
    useBulletinCategories, useCanManageBulletin,
} from "./bulletinShared";

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_IMAGE_MB = 10;

/* --------------------------------------------------------------------- */
/*  Ümumi hissələr                                                        */
/* --------------------------------------------------------------------- */

function FormShell({title, hint, backHref, children, actions, side}) {
    return (
        <Box sx={pageWrapSx}>
            <Button component={Link} href={backHref} startIcon={<ArrowBackIcon/>} sx={{...softButtonSx, mb: 2.5}}>
                Geri
            </Button>
            <Grid container spacing={3}>
                <Grid item xs={12} md={side ? 8 : 12} lg={side ? 8 : 9}>
                    <Box sx={{...panelSx, p: {xs: 2.5, sm: 3.5}}}>
                        <Typography sx={{fontSize: 20, fontWeight: 800, color: C.ink}}>{title}</Typography>
                        {hint && <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>{hint}</Typography>}
                        <Box sx={{mt: 3, display: 'flex', flexDirection: 'column', gap: 2.5}}>{children}</Box>
                        <Box sx={{
                            mt: 3.5, pt: 2.5, borderTop: `1px solid ${C.line}`,
                            display: 'flex', justifyContent: 'flex-end', gap: 1,
                        }}>
                            {actions}
                        </Box>
                    </Box>
                </Grid>
                {side && <Grid item xs={12} md={4} lg={4}>{side}</Grid>}
            </Grid>
        </Box>
    );
}

function FormSkeleton() {
    return (
        <Box sx={pageWrapSx}>
            <Skeleton variant="rounded" height={460} sx={{borderRadius: '12px'}}/>
        </Box>
    );
}

function NoPermission({backHref}) {
    return (
        <Box sx={{...pageWrapSx, textAlign: 'center', py: 10}}>
            <LockOutlinedIcon sx={{fontSize: 44, color: C.inkFaint, mb: 1.5}}/>
            <Typography sx={{fontSize: 18, fontWeight: 700, color: C.ink}}>Bu əməliyyat üçün icazəniz yoxdur</Typography>
            <Typography sx={{fontSize: 13.5, color: C.inkMuted, mt: 0.5, mb: 3}}>
                Sənəd və xəbər əlavə etmək yalnız Elanlar lövhəsinin adminlərinə açıqdır.
            </Typography>
            <Button component={Link} href={backHref} sx={softButtonSx}>Geri qayıt</Button>
        </Box>
    );
}

function useOrganizations(enabled) {
    const [organizations, setOrganizations] = useState([]);
    useEffect(() => {
        if (!enabled) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
                setOrganizations(normalizeList(res.data));
            } catch { /* qurum siyahısı olmadan da forma işləyir */ }
        })();
    }, [enabled]);
    return organizations;
}

function useExisting(detailUrl, enabled) {
    const {enqueueSnackbar} = useSnackbar();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(!!enabled);
    useEffect(() => {
        if (!enabled) return;
        (async () => {
            try {
                const res = await service_api.get(detailUrl);
                setItem(res.data);
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailUrl, enabled]);
    return {item, loading};
}

function OrganizationField({value, onChange, organizations}) {
    return (
        <TextField select label="Qurum" size="small" fullWidth sx={fieldSx}
                   helperText="Boş saxlasanız, bütün qurumların işçilərinə görünəcək."
                   value={value} onChange={(e) => onChange(e.target.value)}>
            <MenuItem value="">Bütün qurumlar</MenuItem>
            {organizations.map((o) => <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>)}
        </TextField>
    );
}

/* --------------------------------------------------------------------- */
/*  Xəbər forması                                                         */
/* --------------------------------------------------------------------- */

export function NewsFormPage({id}) {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isEdit = !!id;
    const {canManage, checking} = useCanManageBulletin();
    const organizations = useOrganizations(isRoot);
    const {item, loading} = useExisting(isEdit ? NEXT_API_ENDPOINTS.BULLETIN.NEWS_DETAIL(id) : null, isEdit);

    const [form, setForm] = useState({title: '', summary: '', body: '', organization: ''});
    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!item) return;
        setForm({
            title: item.title || '',
            summary: item.summary || '',
            body: item.body || '',
            organization: item.organization || '',
        });
    }, [item]);

    const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    const shownImage = preview || item?.image_url || null;

    const backHref = isEdit ? `/elanlar/xeberler/${id}` : '/elanlar/xeberler';

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    function pickImage(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            enqueueSnackbar('Yalnız şəkil faylı seçin (JPG, PNG, WEBP, GIF).', {variant: 'warning'});
            return;
        }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            enqueueSnackbar(`Şəklin həcmi ${MAX_IMAGE_MB} MB-dan çox olmamalıdır.`, {variant: 'warning'});
            return;
        }
        setImage(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) {
            enqueueSnackbar('Başlıq doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('title', form.title.trim());
            payload.append('summary', form.summary || '');
            payload.append('body', form.body || '');
            if (isRoot) payload.append('organization', form.organization || '');
            if (image) payload.append('image', image);
            const config = {headers: {'Content-Type': 'multipart/form-data'}, timeout: 0};

            const res = isEdit
                ? await service_api.patch(NEXT_API_ENDPOINTS.BULLETIN.NEWS_DETAIL(id), payload, config)
                : await service_api.post(NEXT_API_ENDPOINTS.BULLETIN.NEWS, payload, config);
            enqueueSnackbar(isEdit ? 'Xəbər yeniləndi.' : 'Xəbər dərc edildi.', {variant: 'success'});
            router.push(`/elanlar/xeberler/${res.data?.id || id}`);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
            setSaving(false);
        }
    }

    if (checking || (isEdit && loading)) return <FormSkeleton/>;
    if (!canManage) return <NoPermission backHref={backHref}/>;
    if (isEdit && !item) return <NoPermission backHref={backHref}/>;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <FormShell
                title={isEdit ? 'Xəbəri redaktə et' : 'Yeni xəbər'}
                hint="Xəbər Elanlar lövhəsində və xəbərlər arxivində görünəcək."
                backHref={backHref}
                actions={(
                    <>
                        <Button component={Link} href={backHref} disabled={saving}
                                sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                        <Button type="submit" variant="contained" disabled={saving} sx={{...primaryButtonSx, minWidth: 130}}>
                            {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Dərc et')}
                        </Button>
                    </>
                )}
                side={(
                    <Box sx={{...panelSx, p: 2.5}}>
                        <Typography sx={{fontSize: 14, fontWeight: 700, color: C.ink, mb: 1.5}}>Şəkil</Typography>
                        <Box sx={{
                            height: 200, borderRadius: '10px', overflow: 'hidden', mb: 1.5,
                            border: `1px dashed ${C.lineStrong}`, backgroundColor: C.surfaceDeep,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {shownImage ? (
                                <Box component="img" src={shownImage} alt=""
                                     sx={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                            ) : (
                                <Box sx={{textAlign: 'center', color: C.inkFaint}}>
                                    <ImageOutlinedIcon sx={{fontSize: 34}}/>
                                    <Typography sx={{fontSize: 12}}>Şəkil seçilməyib</Typography>
                                </Box>
                            )}
                        </Box>
                        <Button component="label" fullWidth variant="outlined" startIcon={<ImageOutlinedIcon/>}
                                sx={{textTransform: 'none', borderColor: C.line, color: C.ink}}>
                            {shownImage ? 'Şəkli dəyiş' : 'Şəkil seç'}
                            <input type="file" accept={IMAGE_ACCEPT} hidden
                                   onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ''; }}/>
                        </Button>
                        {image && (
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 1}}>
                                <Typography sx={{fontSize: 12, color: C.inkMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                    {image.name}
                                </Typography>
                                <Button size="small" startIcon={<DeleteOutlineIcon/>} onClick={() => setImage(null)}
                                        sx={{textTransform: 'none', color: C.danger}}>Ləğv et</Button>
                            </Box>
                        )}
                        <Typography sx={{fontSize: 11.5, color: C.inkFaint, mt: 1}}>
                            JPG, PNG, WEBP və ya GIF, ən çox {MAX_IMAGE_MB} MB.
                        </Typography>
                    </Box>
                )}
            >
                <TextField label="Başlıq" required size="small" fullWidth sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>
                <TextField label="Qısa xülasə" size="small" fullWidth multiline minRows={2} sx={fieldSx}
                           helperText="Siyahıda başlığın altında görünür."
                           value={form.summary} onChange={(e) => set('summary', e.target.value)}/>
                <TextField label="Mətn" size="small" fullWidth multiline minRows={12} sx={fieldSx}
                           value={form.body} onChange={(e) => set('body', e.target.value)}/>
                {isRoot && <OrganizationField value={form.organization} onChange={(v) => set('organization', v)} organizations={organizations}/>}
            </FormShell>
        </Box>
    );
}

/* --------------------------------------------------------------------- */
/*  Sənəd (sərəncam / fərman / daxili qayda) forması                      */
/* --------------------------------------------------------------------- */

export function CircularFormPage({id, initialCategoryKey}) {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isEdit = !!id;
    const {canManage, checking} = useCanManageBulletin();
    const {categories, loading: categoriesLoading} = useBulletinCategories();
    const organizations = useOrganizations(isRoot);
    const {item, loading} = useExisting(isEdit ? NEXT_API_ENDPOINTS.BULLETIN.CIRCULAR_DETAIL(id) : null, isEdit);

    const [form, setForm] = useState({category: '', title: '', number: '', document_date: '', organization: ''});
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEdit) {
            if (!item) return;
            setForm({
                category: item.category || '',
                title: item.title || '',
                number: item.number || '',
                document_date: item.document_date ? String(item.document_date).slice(0, 10) : '',
                organization: item.organization || '',
            });
            return;
        }
        if (categoriesLoading || !categories.length) return;
        const target = categories.find((c) => c.key === initialCategoryKey) || categories[0];
        setForm((f) => (f.category ? f : {...f, category: target.id}));
    }, [isEdit, item, categories, categoriesLoading, initialCategoryKey]);

    const backHref = isEdit
        ? `/elanlar/senedler/${id}`
        : (initialCategoryKey ? `/elanlar/senedler?category=${initialCategoryKey}` : '/elanlar/senedler');

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.category) {
            enqueueSnackbar('Sənədin növünü seçin.', {variant: 'warning'});
            return;
        }
        if (!form.title.trim()) {
            enqueueSnackbar('Başlıq doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('category', form.category);
            payload.append('title', form.title.trim());
            payload.append('number', form.number || '');
            payload.append('document_date', form.document_date || '');
            if (isRoot) payload.append('organization', form.organization || '');
            if (file) payload.append('file', file);
            const config = {headers: {'Content-Type': 'multipart/form-data'}, timeout: 0};

            const res = isEdit
                ? await service_api.patch(NEXT_API_ENDPOINTS.BULLETIN.CIRCULAR_DETAIL(id), payload, config)
                : await service_api.post(NEXT_API_ENDPOINTS.BULLETIN.CIRCULARS, payload, config);
            enqueueSnackbar(isEdit ? 'Sənəd yeniləndi.' : 'Sənəd əlavə edildi.', {variant: 'success'});
            router.push(`/elanlar/senedler/${res.data?.id || id}`);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
            setSaving(false);
        }
    }

    if (checking || categoriesLoading || (isEdit && loading)) return <FormSkeleton/>;
    if (!canManage) return <NoPermission backHref={backHref}/>;
    if (isEdit && !item) return <NoPermission backHref={backHref}/>;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <FormShell
                title={isEdit ? 'Sənədi redaktə et' : 'Yeni sənəd'}
                hint="Sənəd Elanlar lövhəsində öz bölməsində və sənədlər arxivində görünəcək."
                backHref={backHref}
                actions={(
                    <>
                        <Button component={Link} href={backHref} disabled={saving}
                                sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                        <Button type="submit" variant="contained" disabled={saving} sx={{...primaryButtonSx, minWidth: 130}}>
                            {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Əlavə et')}
                        </Button>
                    </>
                )}
            >
                <TextField select label="Növ" required size="small" fullWidth sx={fieldSx}
                           value={form.category} onChange={(e) => set('category', e.target.value)}
                           helperText={!categories.length ? 'Əvvəlcə "Kateqoriyalar" bölməsindən növ əlavə edin.' : ' '}>
                    {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                </TextField>
                <TextField label="Başlıq" required size="small" fullWidth sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>
                <Box sx={{display: 'flex', gap: 2, flexDirection: {xs: 'column', sm: 'row'}}}>
                    <TextField label="Nömrə" size="small" fullWidth sx={fieldSx}
                               value={form.number} onChange={(e) => set('number', e.target.value)}/>
                    <TextField label="Tarix" type="date" size="small" fullWidth sx={fieldSx}
                               InputLabelProps={{shrink: true}}
                               value={form.document_date} onChange={(e) => set('document_date', e.target.value)}/>
                </Box>
                {isRoot && <OrganizationField value={form.organization} onChange={(v) => set('organization', v)} organizations={organizations}/>}
                <Box>
                    <Button component="label" variant="outlined" startIcon={<AttachFileIcon/>}
                            sx={{textTransform: 'none', borderColor: C.line, color: C.ink}}>
                        {file ? 'Faylı dəyiş' : (item?.file_url ? 'Yeni fayl seç' : 'Fayl seç (PDF, DOCX)')}
                        <input type="file" hidden onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }}/>
                    </Button>
                    <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 1}}>
                        {file
                            ? `Seçilib: ${file.name}`
                            : item?.file_url
                                ? <>Mövcud fayl: <a href={item.file_url} target="_blank" rel="noreferrer" style={{color: C.goldDeep}}>bax</a></>
                                : 'Fayl əlavə edilməyib.'}
                    </Typography>
                </Box>
            </FormShell>
        </Box>
    );
}
