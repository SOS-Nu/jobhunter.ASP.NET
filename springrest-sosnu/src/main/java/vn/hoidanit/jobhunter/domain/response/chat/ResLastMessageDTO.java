// trong package vn.hoidanit.JobZone.domain.response
package vn.hoidanit.JobZone.domain.response.chat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResLastMessageDTO {
    private String content;
    private Long senderId;
    private Instant timestamp;
}