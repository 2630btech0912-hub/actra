CREATE POLICY "Users can update their own logs"
ON public.habit_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own export files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'export_260625' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own export files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'export_260625' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own export files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'export_260625' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'export_260625' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own export files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'export_260625' AND (storage.foldername(name))[1] = auth.uid()::text);