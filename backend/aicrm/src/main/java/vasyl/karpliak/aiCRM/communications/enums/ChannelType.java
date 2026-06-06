package vasyl.karpliak.aiCRM.communications.enums;

public enum ChannelType {
    /** @deprecated legacy — замінено на FACEBOOK. Залишено для сумісності з існуючими записами в БД. */
    @Deprecated
    TELEGRAM,
    FACEBOOK, EMAIL, VIBER, INTERNAL
}
