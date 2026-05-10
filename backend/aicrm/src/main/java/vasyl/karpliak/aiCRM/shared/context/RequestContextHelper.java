package vasyl.karpliak.aiCRM.shared.context;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class RequestContextHelper {

    public static Long getCurrentProjectId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return 1L;
            
            HttpServletRequest request = attributes.getRequest();
            String projectId = request.getHeader("X-Project-Id");
            
            if (projectId != null && !projectId.isBlank()) {
                return Long.parseLong(projectId);
            }
            return 1L; // Default fallback for development
        } catch (Exception e) {
            return 1L;
        }
    }

    public static String getCurrentUserId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return "3"; // Default user ID (vasyl)
            
            HttpServletRequest request = attributes.getRequest();
            String userId = request.getHeader("X-User-Id");
            
            return userId != null ? userId : "3";
        } catch (Exception e) {
            return "3";
        }
    }
}
