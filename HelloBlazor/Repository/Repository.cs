namespace HelloBlazor.Persistence
{
    public interface Repository<T>
    {
        #region Default
        public bool Save(T parEntity);
        public bool Delete(T parEntity);
        public bool Delete(string parId);
        public T GetByKey(string parKey, string parValue);
        #endregion
    }
}
